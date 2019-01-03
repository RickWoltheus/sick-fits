
import PleaseSignIn from '../components/PleaseSignIn';
import OrderList from '../components/Orders'

const Orders = props => (
    <div>
        <PleaseSignIn>
            <OrderList />
        </PleaseSignIn>
    </div>
)


export default Orders