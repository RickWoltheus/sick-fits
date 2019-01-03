const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const { transport, makeANiceEmail } = require('../mail')
const {hasPermission} = require('./../utils')
const stripe = require('../stripe')

const Mutations = {
    async createItem(parent, args, ctx, info) {
        const item = await ctx.db.mutation.createItem({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                ...args
            }
        }, info)

        return item
    },
    updateItem(parent, args, ctx, info) {
        const updates = {...args}
        delete updates.id
        return ctx.db.mutation.updateItem(
            {
                data: updates,
                where: {
                    id: args.id
                }
            }, 
        info
        )
    },
    async deleteItem(parent, args, ctx, info) {

        const where = { id: args.id };

        const item = await ctx.db.query.item({where}, `{ 
            id 
            title 
            user {
                id
            } 
        }`)

        const ownsItem = item.user.id === ctx.request.userId
        const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission))

        if(!ownsItem && !hasPermissions ) {
            throw new Error('you dont have permissions to do that')
        }

        return ctx.db.mutation.deleteItem({
            where
        }, info)
    },
    async signup(parent, args, ctx, info) {
        // 1. lowercase email to prevent case sensitive errors
        args.email = args.email.toLowerCase();

        // 2. hash password that is coming from the arguments(frontend)
        const password = await bcrypt.hash(args.password, 10)

        // 3. create user with form data and hashed password
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER']}
            }
        }, info)

        // 4. create jwt token
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET)
        
        // 5. set cookies with user id and app_secret to keep user loggedin
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 *60 * 24 * 367
        })

        // 6. return created user
        return user
    },
    async signin(parent, args, ctx, info) {
        const {email, password} = args

        const user = await ctx.db.query.user({where: {email}})

        if(!user) {
            throw new Error(`No such user found for email ${email}`)
        }

        const valid = await bcrypt.compare(password, user.password)

        if(!valid) {
            throw new Error('invalid password')
        }

        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET)

        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 *60 * 24 * 367
        })

        return user
    },
    async signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token')
        return {message: 'Goodbye'}
    },
    async requestReset(parent, args, ctx, info) {
        const {email} = args
        // 1. check if user is real
        const user = await ctx.db.query.user({where: {email}})

        if(!user) {
            throw new Error('No user with this email')
        }
        // 2. set reset token and expiry date on user
        const randomBytesPromisefied = promisify(randomBytes)
        const resetToken = (await randomBytesPromisefied(20)).toString('hex')
        const resetTokenExpiry = Date.now() + 3600000
        const res = ctx.db.mutation.updateUser({
            where: { email: args.email },
            data: { resetToken, resetTokenExpiry}
        })
        // 3. send user email with reset token
        const mailRes = await transport.sendMail({
            from: 'suprem@gmail.com',
            to: user.email,
            subject: 'reset password | SUPREM',
            html: makeANiceEmail(`your password Reset token is here</p> \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}"> Click here to reset password </a>`)
        })

        // 3. return message
        return {message: 'thanks'}

    },
    async resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
        if (args.password !== args.confirmPassword) {
            throw new Error("Yo Passwords don't match!");
        }
        // 2. check if its a legit reset token
        // 3. Check if its expired
        const [user] = await ctx.db.query.users({
            where: {
            resetToken: args.resetToken,
            resetTokenExpiry_gte: Date.now() - 3600000,
            },
        });
        if (!user) {
            throw new Error('This token is either invalid or expired!');
        }
        // 4. Hash their new password
        const password = await bcrypt.hash(args.password, 10);
        // 5. Save the new password to the user and remove old resetToken fields
        const updatedUser = await ctx.db.mutation.updateUser({
            where: { email: user.email },
            data: {
            password,
            resetToken: null,
            resetTokenExpiry: null,
            },
        });
        // 6. Generate JWT
        const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
        // 7. Set the JWT cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        // 8. return the new user
        return updatedUser;
    },

    async updatePermissions(parent, args, ctx, info) {
        // login check
        if(!ctx.request.userId) {
            throw new Error('you must be logged in to do that')
        }

        // query the user

        const currentUser = await ctx.db.query.user({
            where: { id: ctx.request.userId}
        }, info)

        

        // check if permissions
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])

        // update
        return ctx.db.mutation.updateUser({
            data: {
                permissions: {
                    set: args.permissions
                }
            },
            where: {
                id: args.userId
            },
        }, info)
    },

    async addToCart(parent, args, ctx, info) {
        const {userId} = ctx.request
        // check if signed in 
        if(!userId) {
            throw new Error('you must be logged in to do that')
        }

        // query user cart item
        const [existingCartItem] = await ctx.db.query.cartItems({
            where: {
                user: {id: userId},
                item: {id: args.id}
            }
        })

        // check if already in cart
        if(existingCartItem) {
            console.log('already present in cart')
            return ctx.db.mutation.updateCartItem({
                where: { id: existingCartItem.id},
                data: {quantity: existingCartItem.quantity + 1}
            }, info)
        }

        // if its not create new connection
        return ctx.db.mutation.createCartItem({
            data: {
                user: {
                    connect: {id: userId},
                },
                item: {
                    connect: {id: args.id}
                } 
            }
        }, info)
    },
    async removeFromCart(partent, args, ctx, info) {
        // find item
        const cartItem = await ctx.db.query.cartItem({
            where: {
                id: args.id,
            }
        }, `{id, user { id }}`)

        if (!cartItem) {
            throw new Error('No cartItem found')
        }
        // is it his item?
        if(cartItem.user.id !== ctx.request.userId) {
            throw new Error(' you have no permissions ')
        }

        // delete that 

        return ctx.db.mutation.deleteCartItem({
            where: {id: args.id}
        }, info)
    },
    async createOrder(parent, args, ctx, info) {
        // 1. Query the current user with cart and make sure they are signed in
        const {userId} = ctx.request
        if (!userId) throw new Error('you must be signed in to complete order')
        
        const user = await ctx.db.query.user(
            {where: { id: userId }},
            `{
                id
                name
                email
                cart {
                    id
                    quantity
                    item {
                        title
                        price
                        id
                        description
                        image
                        largeImage
                    }
                }
            }`,
            info
        )

        // 2. recalculate the total price, because if i get the price from the frontend it is hackable
        const amount = user.cart.filter(cartItem => cartItem.item !== null).reduce((tally, cartItem) => tally + cartItem.item.price * cartItem.quantity, 0)
        console.log(`charge for ${amount}`)

        // 3. create Stripe charge
        const charge = await stripe.charges.create({
            amount,
            currency: 'USD',
            source: args.token
        })


        // 4. convert cart items to order items
        const orderItems = user.cart.map(cartItem => {
            const orderItem = {
                ...cartItem.item,
                quantity: cartItem.quantity,
                user: { connect: {id: userId}},
            }
            delete orderItem.id
            return orderItem
        })

        // 5. create order in database
        const order = await ctx.db.mutation.createOrder({
            data: {
                total: charge.amount,
                charge: charge.id,
                items: { create: orderItems }, // prisma creates it for us in one query
                user: {connect: {id: userId }} // connect relation to current user
            }
        })

        // 6. clean user cart, because we dont need it
        const cartItemIds = user.cart.map(cartItem => cartItem.id)
        await ctx.db.mutation.deleteManyCartItems({
            where: {
                id_in: cartItemIds // with id_in prisma deletes all id's in array for us
            }
        })

        // 7. return order to client
        return order
    }
};



module.exports = Mutations;
