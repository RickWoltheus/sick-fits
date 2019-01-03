import ItemComponent from '../components/Item'
import {shallow} from 'enzyme'

const fakeItem = {
    id: 'abcd',
    title: "my title",
    price: 5000,
    description: 'my description',
    image: 'dog.jpg',
    largeImage: 'largeDiog.jpg'
}

describe('<Item/>', () => {

    it('renders image properly', () => {
        
    })

    it('render and displays properly', () => {
        const wrapper = shallow(<ItemComponent item={fakeItem} />)
        const PriceTag = wrapper.find('PriceTag')
        console.log(PriceTag.children())
        expect(PriceTag.children().text()).toBe('$50')
        expect(wrapper.find('Title a').text()).toBe(fakeItem.title)

        const img = wrapper.find('img')
        expect(img.props().src).toBe(fakeItem.image)
        expect(img.props().alt).toBe(fakeItem.title)
    })
})