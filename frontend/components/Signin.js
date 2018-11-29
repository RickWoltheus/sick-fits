import React, { Component } from 'react';
import Form from './styles/Form';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import Error from './ErrorMessage'
import {CURRENT_USER_QUERY} from './User'


const SIGNIN_MUTATION  = gql`
    mutation SIGNIN_MUTATION($email: String!, $password: String!) {
        signin(email: $email,  password: $password) {
            id
            email
            name
        }
    }
`

class Signin extends Component {

    state = {
        email: '',
        password: ''
    }

    saveToState = (e) => {
        this.setState({[e.target.name]: e.target.value})
    }



    render() {
        return (
            <Mutation 
                mutation={SIGNIN_MUTATION} 
                variables={this.state}
                refetchQueries={[{ query: CURRENT_USER_QUERY}]}
            >
            {(signup, {loading, error}) => {

                return (
                    <Form method="post" onSubmit={async e => {
                        e.preventDefault()
                        await signup()
                        this.setState({name: '', email: '', password: ''})
                    }}> 
                        <fieldset disabled={loading} aria-busy={loading}>
                            <h2>Sign in</h2>
                            <Error error={error}/>
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

                            <label htmlFor="password">
                                Password
                                <input 
                                    type="password" 
                                    name="password"
                                    placeholder="password"
                                    value={this.state.password}
                                    onChange={this.saveToState}
                                />
                            </label>

                            <button type="submit"> Sign Up </button>

                        </fieldset>
                    </Form>
                )
            }}
            </Mutation>
        );
    }
}

export default Signin;