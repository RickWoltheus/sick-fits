import React from 'react'
import {Query, Mutation} from 'react-apollo'
import Error from './ErrorMessage'
import gql from 'graphql-tag';
import Table from  './styles/Table'
import SickButton from './styles/SickButton'
import PropTypes from 'prop-types'

const possiblePermissions = [
    "ADMIN",
    "USER",
    "ITEMCREATE",
    "ITEMUPDATE",
    "ITEMDELETE",
    "PERMISSIONUPDATE",
]

const Permissions = ({
    props
}) => (
    <Query query={ALL_USERS_QUERY}>
        {({data, loading, error}) => (
            <div>
                <Error error={error} />
                <p>hey</p>
                <div>
                    <h2>Manage Permissions</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>
                                    Name
                                </th>
                                <th>
                                    Email
                                </th>
                                {possiblePermissions.map((permission, i, array) => (
                                    <th key={`${i}-${array.length}`}>{permission}</th>
                                ))}
                                <th>action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map((user, i, array) => (
                                <UserPermissions key={`${i}-${array.length}`} user={user}/>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        )}
    </Query>
);

class UserPermissions extends React.Component {
    static propTypes = {
        user: PropTypes.shape({
            name: PropTypes.string,
            email: PropTypes.string,
            id: PropTypes.string,
            permissions: PropTypes.array,
        }).isRequired
    }

    state = {
        permissions: this.props.user.permissions
    }
    render () {
        const user = this.props.user
        const {permissions} = this.state

        return (
            <Mutation 
                mutation={UPDATE_PERMISSIONS_MUTATION} 
                variables={{
                    permissions: this.state.permissions,
                    userId: user.id,
                }}
            >
                {(updatePermissions, {loading, error}) => (
                    <React.Fragment>
                        {error && <Error error={error}/>}
                        <tr>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            {possiblePermissions.map((permission, i, array) => (
                                <td key={`${i}-${array.length}`}>
                                    <label htmlFor={`${user.id}-permission-${permission}`}>
                                        <input 
                                            id={`${user.id}-permission-${permission}`}
                                            type={'checkbox'} 
                                            checked={permissions.includes(permission)} 
                                            value={permission}
                                            onChange={e => {
                                                this.handlePermissionChange(e, updatePermissions)
                                            }}
                                        />
                                    </label>
                                </td>
                            ))}
                            <td>
                                <SickButton disabled={loading} onClick={updatePermissions}>
                                    {loading ? 'updating' : 'update'}
                                </SickButton>
                            </td>
                        </tr>
                    </React.Fragment>
                )}
            </Mutation>
        )
    }

    handlePermissionChange = (e, updatePermissions) => {
        const checkbox = e.target;
        let updatedPermissions = [...this.state.permissions]

        if(checkbox.checked) {
            updatedPermissions.push(checkbox.value)
        }  else {
            updatedPermissions = updatedPermissions.filter(permission => permission !== checkbox.value)
        }

        this.setState({permissions: updatedPermissions}, () => {
            updatePermissions()
        })
    }
}

const UPDATE_PERMISSIONS_MUTATION = gql`
    mutation updatePermissions($permissions: [Permission], $userId: ID!) {
        updatePermissions(permissions: $permissions, userId: $userId) {
            id
            permissions
            name
            email
        }
    }

`

const ALL_USERS_QUERY = gql`
    query {
        users {
            id
            email
            name
            permissions
        }
    }
`

export default Permissions;
