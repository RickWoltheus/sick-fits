import React, { Component } from 'react';
import gql from 'graphql-tag'
import {Query} from 'react-apollo'
import { formatDistance } from 'date-fns'
import Link from 'next/link'
import styled from 'styled-components'
import formatMoney from '../lib/formatMoney'
import OrderItemStyles from '../components/styles/OrderItemStyles'
import Error from '../components/ErrorMessage'


const ALL_ORDERS_QUERY = gql`
    query {
        orders {
            id
            total
            createdAt
            items {
                id
                title
                price
                description
                quantity
                image
            }
        }
    }
`

const OrderUl = styled.ul`
    display: grid;
    grid-gap: 4rem;
    grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`

class OrderList extends Component {
    render() {
        return (
            <Query query={ALL_ORDERS_QUERY}>
                {({data, error, loading}) => {
                    if(error) return <Error error={error} />
                    if(loading) return <p>loading..</p>
                    if(!data.orders) return <p>empty..</p>

                    return (
                        <div>
                            <p> you have {data.orders.length} orders</p>
                            <OrderUl>
                                {data.orders.map(order => (
                                    <OrderItemStyles key={order.id}>
                                        <Link 
                                            href={{
                                                pathname:'/order',
                                                query: {id: order.id},
                                            }}
                                        >
                                            <a>
                                                <div className="order-meta">
                                                    <p> {order.items.reduce((a, b) => a + b.quantity, 0)} items</p>
                                                    <p> {order.items.length}</p>
                                                    <p> {formatDistance(order.createdAt, new Date())}</p>
                                                    <p> {formatMoney(order.total)}</p>
                                                </div>
                                                <div className="images">
                                                    {order.items.map(item => (
                                                        <img key={item.id} src={item.image} alt={item.title} />
                                                    ))}
                                                </div>    
                                            </a>  
                                        </Link>
                                    </OrderItemStyles>
                                ))}
                            </OrderUl>
                        </div>
                    )
                }}
            </Query>
        );
    }
}

export default OrderList;