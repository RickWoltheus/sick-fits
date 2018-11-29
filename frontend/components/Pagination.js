import React from 'react';
import PaginationStyles from './styles/PaginationStyles'
import Head from 'next/head'
import Link from 'next/link'
import gql from 'graphql-tag'
import { Query } from 'react-apollo';
import {perPage} from '../config'

const PAGINATION_QUERY = gql`
    query PAGINATION_QUERY {
        itemsConnection {
            aggregate {
                count
            }
        }
    }
`

const Pagination = props => {
    return (
        <Query query={PAGINATION_QUERY}>
            {({data, loading, error}) => {
                if (loading) return <p>loading ...</p>

                const count = data.itemsConnection.aggregate.count
                const pages = Math.ceil(count / perPage)
                const page = props.page

                return (
                    <PaginationStyles>
                        <Head>
                            <title>Sick Fits! - Page {page} of {pages}</title>
                        </Head>
                        <Link 
                            prefetch
                            href={{
                                pathName: 'items',
                                query: { page: page - 1}
                            }}
                        >
                            <a className="prev" aria-disabled={page <= 1}>previous</a>
                        </Link>
                        <p>
                            Page {props.page} of {pages}!
                        </p>
                        <p>
                            {count} items total
                        </p>
                        <Link 
                            prefetch
                            href={{
                                pathName: 'items',
                                query: { page: page + 1}
                            }}
                        >
                            <a className="prev" aria-disabled={page >= pages}>
                                next
                            </a>
                        </Link>
                    </PaginationStyles>
                )
            }}    
            </Query>
    );
}

export default Pagination;