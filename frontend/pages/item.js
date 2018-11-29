import ItemDetail from '../components/ItemDetail'

const Item = props => (
    <div>
        <ItemDetail id={props.query.id} />
    </div>
)

export default Item