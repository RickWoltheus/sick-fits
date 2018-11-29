import React, { Component } from 'react';
import Form from './styles/Form';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import Error from './ErrorMessage'
import {CURRENT_USER_QUERY} from './User'


const REQUEST_RESET_MUTATION = gql`
    mutation REQUEST_RESET_MUTATION($email: String!) {
        requestReset(email: $email) {
            message
        }
    }
`

class RequestReset extends Component {

    state = {
        email: '',
    }

    saveToState = (e) => {
        this.setState({[e.target.name]: e.target.value})
    }



    render() {
        return (
            <Mutation 
                mutation={REQUEST_RESET_MUTATION} 
                variables={this.state}
                // refetchQueries={[{ query: }]}
            >
            {(requestReset, {loading, error, called}) => {

                return (
                    <Form method="post" onSubmit={async e => {
                        e.preventDefault()
                        await requestReset()
                        this.setState({email: ''})
                    }}> 
                        <fieldset disabled={loading} aria-busy={loading}>
                            <h2>Request reset</h2>
                            <Error error={error}/>
                            {!error && !loading && called && <p>success! check your email</p>}
                            <label htmlFor="email">
                                email
                                <input 
                                    type="email" 
                                    name="email"
                                    placeholder="email"
                                    value={this.state.email}
                                    onChange={this.saveToState}
                                />
                            </label>

                            <button type="submit">Request reset</button>

                        </fieldset>
                    </Form>
                )
            }}
            </Mutation>
        );
    }
}

export default RequestReset;