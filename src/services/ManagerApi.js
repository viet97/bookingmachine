import axios from "axios"

const baseUrl = "https://videv-queue.casperpas.dev/api/v1/ticket/"
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

const list = () => {
    return GET(path.list)
}

const bookLocal = () => {
    return POST(path.book_local, {
        serviceId,
        partner
    })
}

export default {
    list,
    bookLocal
}