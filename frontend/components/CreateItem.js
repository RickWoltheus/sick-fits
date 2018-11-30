import React, { Component } from 'react';
import { Mutation} from 'react-apollo';
import Router from 'next/router'
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney'
import gql from 'graphql-tag'
import Error from './ErrorMessage'


const CREATE_ITEM_MUTATION = gql`
    mutation CREATE_ITEM_MUTATION(
            $title: String!
            $description: String!
            $price: Int!
            $image: String
            $largeImage: String
    ) {
        createItem( 
            title: $title
            description: $description
            price: $price
            image: $image
            largeImage: $largeImage
        ) {
            id
        }
    }
`;

class CreateItem extends Component {

    state = {
        title: 'hey',
        description: '',
        image: '',
        largeImage: '',
        price: 0,
        loadingImage: false,
    }

    handleChange = e => {
        const { name, type, value} = e.target
        const val = type === 'number' ? parseFloat(value) : value
        this.setState({[name]: e.target.value})
    }

    uploadFile = async e => {
        const files = e.target.files;
        const data = new FormData()
        data.append('file', files[0]);
        data.append('upload_preset', 'rikkert13')

        this.setState({loadingImage: true})

        const res = await fetch(
            'https://api.cloudinary.com/v1_1/rick-woltheus/image/upload',
            {
                method: 'POST',
                body: data
            }
        )

        this.setState({loadingImage: false})

        //: TODO: error state if cloudinary is unverified or something
        const file = await res.json()
        
        this.setState({
            image: file.secure_url,
            largeImage: file.eager[0].secure_url
        })


    }

    render() {
        return (
            <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state} >
                {(createItem, {loading, error}) => (
                    <Form onSubmit={async e => {
                        e.preventDefault();
                        const res = await createItem()

                        Router.push({
                            pathname: '/items',
                        })
                    }}>
                        <Error error={error} />
                        <fieldset disabled={loading} aria-busy={loading}>
                        <label htmlFor="title">
                            file
                            <input 
                                type="file" 
                                id="file" 
                                name="file" 
                                placeholder="upload a image" 
                                required 
                                onChange={this.uploadFile}
                                />
                                {this.state.image && <img src={this.state.image} alt="upload preview" />}
                            </label>

                            <label htmlFor="title">
                            title
                            <input 
                                type="text" 
                                id="title" 
                                name="title" 
                                placeholder="title" 
                                required 
                                value={this.state.title}
                                onChange={this.handleChange}
                                />
                            </label>

                            <label htmlFor="price">
                            price
                            <input 
                                type="number" 
                                id="price" 
                                name="price" 
                                placeholder="price" 
                                required 
                                value={this.state.price}
                                onChange={this.handleChange}
                                />
                            </label>

                            <label htmlFor="description">
                            description
                            <textarea 
                                type="text" 
                                id="description" 
                                name="description" 
                                placeholder="description" 
                                required 
                                value={this.state.description}
                                onChange={this.handleChange}
                                />
                            </label>  
                            <button disabled={this.state.loadingImage} type='submit'>Submit</button>
                        </fieldset>
                    </Form>
                )}
            </Mutation>
        );
    }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION }