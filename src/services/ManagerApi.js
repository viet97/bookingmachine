import axios from "axios"
import firestore from '@react-native-firebase/firestore';
import { API_URL } from "@env"

// const baseUrl = "https://videv-queue.casperpas.dev/api/v1/ticket/"
const baseUrl = API_URL
const serviceId = "TbypX9PFPrnMMYsAAfiu"
const partner = "DxpHgJHNr2Pma0wwSDc7"
const path = {
    list: 'list',
    next: 'next',
    book_remote: 'book-remote',
    book_local: 'book-local',
    cancel: 'cancel',
    check_in: 'check-in',
    done: 'done',
    update: 'update',
    add: 'apis/add',
    cancel: 'apis/cancel',
    apis: 'apis',
    banners: 'apis/banners',
}

const timeout = 30000

const GET = async (path, params = {}) => {
    const url = baseUrl + path
    const response = await axios({
        method: 'get',
        url,
        timeout,
        params: {
            ...params,
            partner
        }
    })
    return response
}

const POST = async (path, data = {}) => {
    const url = baseUrl + path
    const response = await axios({
        method: 'post',
        url,
        data: {
            ...data,
            partner
        },
        timeout,
    })
    return response
}

const apis = () => {
    return GET(path.apis)
}

const list = () => {
    return GET(path.list)
}

const getBanners = () => {
    return GET(path.banners)
}

const bookLocal = () => {
    return POST(path.book_local, {
        serviceId,
        partner
    })
}

const add = (params) => {
    return POST(path.add, params)
}



const getCollection = (name) => {
    return firestore().collection(name)
}

const getPartner = () => {
    return getCollection("partners").doc(partner).get()
}

export default {
    list,
    bookLocal,
    getCollection,
    getPartner,
    apis,
    add,
    getBanners
}