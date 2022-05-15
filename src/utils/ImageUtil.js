import { CDN_URL } from "../config/env"

export const resolveImagePath = (path) => `${CDN_URL}/${path}`

export default {
    resolveImagePath
}