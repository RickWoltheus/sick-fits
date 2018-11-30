import  Link from 'next/link'
import NavStyles from './styles/NavStyles'
import User from './User'
import Signout from './Signout';
import {Mutation} from 'react-apollo'
import {TOGGLE_CART_MUTATION} from './Cart'
import CartCount from './DotCount'


const Nav = () => (
        <User>
            {({ data: {me, error} }) => (
                <NavStyles>
                    <Link href={"/items"}>
                        <a>Shop</a>
                    </Link>
                    {me && (
                        <React.Fragment>
                            <Link href={"/sell"}>
                                <a>sell</a>
                            </Link>
                            <Link href={"/orders"}>
                                <a>orders</a>
                            </Link>
                            <Link href={"/me"}>
                                <a>me</a>
                            </Link>
                            <Signout />
                            <Mutation mutation={TOGGLE_CART_MUTATION}>
                                {(toggleCart) => (
                                    <button onClick={toggleCart}>
                                        my cart
                                        <CartCount count={me.cart.reduce((tally, CartItem) => tally + CartItem.quantity, 0)} />
                                    </button>
                                )}
                            </Mutation>
                        </React.Fragment>
                    )}
                    {!me && (
                        <Link href={"/signup"}>
                            <a>signup</a>
                        </Link>
                    )}
                </NavStyles>
            )}
        </User>
)

export default Nav