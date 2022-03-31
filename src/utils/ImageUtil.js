import { CDN_URL } from "@env"

export const resolveImagePath = (path) => `${CDN_URL}/${path}`

export default {
    resolveImagePath
}