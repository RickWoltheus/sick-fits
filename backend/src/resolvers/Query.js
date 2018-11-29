const { forwardTo } = require('prisma-binding')
const {hasPermissions} = require('../utils')

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
        hasPermissions(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])

        // 3. if they do query all users
        return ctx.db.users({}, info)
    }
};

module.exports = Query;
