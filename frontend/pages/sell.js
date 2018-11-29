import CreateItem from '../components/CreateItem'


import styled from 'styled-components';
import PleaseSignIn from '../components/PleaseSignIn';

const Columns = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    grid-gap: 20px;
`
const Sell = props => (
    <div>
        <PleaseSignIn>
            <CreateItem />
        </PleaseSignIn>
    </div>
)


export default Sell