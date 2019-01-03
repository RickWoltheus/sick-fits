import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Query } from 'react-apollo';
import Error from '../components/ErrorMessage'
import gql from 'graphql-tag'
import { format } from 'date-fns';
import OrderStyles from '../components/styles/OrderStyles'
import Head from 'next/head';
import formatMoney from '../lib/formatMoney';



const SINGLE_ORDER_QUERY = gql`
    query SINGLE_ORDER_QUERY($id: ID!) {
        order(id: $id) {
            id
            charge
            total
            createdAt
            user {
                id
            }
            items {
                id
                title
                description
                price
                image
                quantity
            }
        }
    }
`

class OrderPage extends Component {
    static propTypes = {
        id: PropTypes.string.isRequired
    }

    render() {
        console.log(this.props.id)
        return (
            <Query query={SINGLE_ORDER_QUERY} variables={{id: this.props.id}}>
            {({data, error, loading}) => {
                if(error) return <Error error={error} /> 
                if(loading) return <p>loading..</p>
                const order = data.order

                return (
                    <OrderStyles>
                        <Head>
                            <title>Sick fits - order {order.id}</title>
                        </Head>
                        <p>
                            <span>Order ID:</span>
                            <span>{this.props.id}</span>
                        </p>
                        <p>
                            <span>Charge</span>
                            <span>{order.charge}</span>
                        </p>
                        <p>
                            <span>Date</span>
                            <span>{format(order.createdAt, 'MMMM d, yyyy h:mm a')}</span>
                        </p>
                        <p>
                            <span>Order total</span>
                            <span>{formatMoney(order.total)}</span>
                        </p>
                        <p>
                            <span>Item count</span>
                            <span>{order.items.length}</span>
                        </p>
                        <div className="items">
                            {order.items.map(item => (
                                <div className="order-item" key={item.id}>
                                <img src={item.image} alt={item.title} />
                                    <div className="item-details">
                                        <h2>{item.title}</h2>
                                        <p>Qty: {item.quantity}</p>
                                        <p>Each: {formatMoney(item.price)}</p>
                                        <p>SubTotal: {formatMoney(item.price * item.quantity)}</p>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </OrderStyles>
                )
            }}
            </Query>
        );
    }
}

export default OrderPage;