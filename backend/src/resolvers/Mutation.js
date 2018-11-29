const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const { transport, makeANiceEmail } = require('../mail')

const Mutations = {
    async createItem(parent, args, ctx, info) {
        if(!ctx.request.userID) {
            throw new Error('you must be logged in to do that')
        }
        const item = await ctx.db.mutation.createItem({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                }
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

        const item = await ctx.db.query.item({where}, `{ id title}`)

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
                permissions: { set: ['User']}
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
    }
};

module.exports = Mutations;
