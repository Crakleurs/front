import axios, {AxiosPromise} from "axios";
import {Post, PostCreation, PostUpdate} from "./types";

export const createPost = (post: PostCreation): AxiosPromise<Post> => {
    return axios.post("/post", post);
};

export const updatePost = (id: number, updateInformation: PostUpdate): AxiosPromise<void> => {
    return axios.put(`/post/${id}`, updateInformation);
};

export const deletePost = (id: number): AxiosPromise<void> => {
    return axios.delete(`/post/${id}`);
};