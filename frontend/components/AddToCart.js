import React from 'react'
import {Mutation} from 'react-apollo'
import gql from 'graphql-tag'
import {CURRENT_USER_QUERY} from './User'
const ADD_TO_CART_MUTATION = gql`
    mutation addToCart($id: ID!) {
        addToCart(id: $id) {
            id
            quantity
        }
    }
`

class addToCart extends React.Component {
    render() {
        const {id} = this.props
        return (
            <Mutation 
                mutation={ADD_TO_CART_MUTATION} 
                variables={{
                    id
                }}
                refetchQueries={[{ query: CURRENT_USER_QUERY }]}
            >
                {(addToCart, {error, loading}) => (
                    <button disabled={loading} onClick={addToCart}>
                        Add{loading ? 'ing' : ''} to cart
                    </button>
                )}
            </Mutation>
        )
    }
}

export default addToCart