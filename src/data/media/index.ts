import {AxiosPromise} from "axios"
import {Media, MediaUploadNSFW} from "./types"
import {apiClient} from "../http"

export const createMedia = (media: MediaUploadNSFW, club?: number, gallery = false, progressListener?: (progressEvent: any) => void): AxiosPromise<Media> => {
    const fd = new FormData()
    fd.append("file", media.file as Blob)
    fd.append("nsfw", Boolean(media.nsfw).toString())

    return apiClient.post("/media", fd, {params: {club, gallery, nsfw: media.nsfw}, onUploadProgress: progressListener})
}

export const toggleMediaNSFW = (id: number): AxiosPromise<boolean> => apiClient.put(`${id}/nsfw`)