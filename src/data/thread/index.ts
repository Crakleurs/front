import {AxiosPromise} from "axios"
import {Comment, CommentForm, CommentUpdate, ThreadState} from "./types"
import {apiClient} from "../http"

export const toggleThreadLike = (id: number): AxiosPromise<boolean> => {
    return apiClient.put(`/thread/${id}/like`)
}

export const getThread = (id: number): AxiosPromise<ThreadState> => apiClient.get(`/thread/${id}`)

export const getThreadComments = (id: number): AxiosPromise<Comment[]> => {
    return apiClient.get(`/thread/${id}/comment`)
}

export const commentThread = (id: number, comment: CommentForm): AxiosPromise<CommentUpdate> => {
    return apiClient.put(`/thread/${id}/comment`, comment)
}

export const editThreadComment = (id: number, comID: number, message: string): AxiosPromise<CommentUpdate> => {
    return apiClient.put(`/thread/${id}/comment/${comID}`, {message})
}

export const deleteThreadComment = (id: number, comID: number): AxiosPromise<void> => {
    return apiClient.delete(`/thread/${id}/comment/${comID}`)
}