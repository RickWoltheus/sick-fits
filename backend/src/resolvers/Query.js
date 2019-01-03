const { forwardTo } = require('prisma-binding')
const {hasPermission} = require('../utils')

const Query = {
    items: forwardTo('db'),
    item: forwardTo('db'),
    itemsConnection: forwardTo('db'),
    me(parent, args, ctx, info) {

        if(!ctx.request.userId) {
            return null
        }
        return ctx.db.query.user({
            where: { id: ctx.request.userId}
        }, info)
    },
    async items(parent, args, ctx, info) {
        const items = ctx.db.query.items()

        return items
    },
    async users(parent, args, ctx, info) {
        // 1. check if they are loggedin
        if(!ctx.request.userId) {
            throw new Error('no userId given(not loggedin)')
        }

        // 2. check if user has the permissions to query all users
        hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])

        // 3. if they do query all users
        return ctx.db.query.users({}, info)
    },
    async order(parent, args, ctx, info) {
        //1. make sure they are logged in
        if(!ctx.request.userId) {
            throw new Error('no userId given(not loggedin)')
        }

        //2. query the current order
        const order = await ctx.db.query.order({
            where: {id: args.id}
        }, info)
        //3. check permissions
        const ownsOrder = order.user.id === ctx.request.userId
        const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN')
        if(!ownsOrder || !hasPermissionToSeeOrder) {
            throw new Error('you dont have permissions to see this')
        }

        //4. return to client
        return order
    },
    async orders(parent, args, ctx, info) {
        const userId = ctx.request.userId
        //1. check if user is loggedin
        if(!userId) {
            throw new Error('no userId given(not loggedin)')
        }
        //2. return all orders
        return ctx.db.query.orders({
            where: {
                user: {
                    id: userId
                }
            }
        }, info)
    }
};

module.exports = Query;
