import React, { Component } from 'react';
import gql from 'graphql-tag'
import {Mutation} from 'react-apollo'
import { ALL_ITEMS_QUERY } from './Items'

const DELETE_ITEM_MUTATION = gql`
    mutation DELETE_ITEM_MUTATION($id: ID!) {
        deleteItem(id: $id) {
            id
        }
    }
`;

class DeleteItem extends Component {
    
    handleDeletePress = async (deleteItem) => {
        if (confirm('you sure?')) {
            await deleteItem().catch(err => {
                alert(err.message)
            })
        }
    }

    update = (cache, payload) => {
        const data = cache.readQuery({ query: ALL_ITEMS_QUERY })
        data.items = data.items.filter(item => item.id !== payload.data.deleteItem.id)
        cache.writeQuery({query: ALL_ITEMS_QUERY, data})
        
    }

    render() {
        const { id } = this.props
        return (
            <Mutation mutation={DELETE_ITEM_MUTATION} variables={{id}} update={this.update}>
                {(deleteItem, {loading, error}) => (
                    <button onClick={() => this.handleDeletePress(deleteItem)}>
                        {!loading ? this.props.children : 'loading ...'}
                    </button>
                )}
            </Mutation>
        );
    }
}

export default DeleteItem;