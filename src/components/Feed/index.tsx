import React, {
    CSSProperties,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import {EmbedEnumType, Post as PostType, PostUpdate} from "../../data/post/types"
import {getFeedPost, getFeedPostPinned} from "../../data/feed"
import InfiniteScroller from "../Common/InfiniteScroller"
import Post from "../Post"
import {Divider, message, Modal} from "antd"
import CardTextSkeleton from "../Skeletons/CardTextSkeleton"
import {useTranslation} from "react-i18next"
import BasicPostForm from "../Post/Form/BasicPostForm"
import PostCreateForm from "../Post/Form/PostCreateForm"
import {faChartBar, faImages, faPaperclip, faVideo} from "@fortawesome/free-solid-svg-icons"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faNewspaper} from "@fortawesome/free-regular-svg-icons"
import {AppContext} from "../../context/app/context"
import "./Feed.css"
import FeedsManager, {feedsManager, ManagerPost} from "../../datamanager/FeedsManager"
import {useLiveQuery} from "dexie-react-hooks"
import {isAfter, isBefore} from "date-fns"
import { useHistory, useLocation } from "react-router-dom"

type FeedProps = {
    loading?: boolean,
    id?: number
    allowPublication?: boolean
    style?: CSSProperties
    className?: string
}
const Feed: React.FC<FeedProps> = ({loading, id, allowPublication, style, className}) => {
    const {state: {user}} = useContext(AppContext)
    const {t} = useTranslation(["common", "post", "error"])
    const [postsPinned, setPostsPinned] = useState<PostType[]>([])
    const [editPost, setEditPost] = useState<number>(0)
    const [completeFormType, setCompleteFormType] = useState<EmbedEnumType | undefined>()
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState<boolean>(false)
    const [baseLastLoad, setBaseLastLoad] = useState<number>(-1)
    const [generalLoading, setGeneralLoading] = useState(true)
    const loadingInformations = useMemo(() => loading || baseLastLoad == -1 || generalLoading, [baseLastLoad, loading, generalLoading])
    const [needFullReload, setNeedFullReload] = useState(false)
    const [firstLoaded, setFirstLoaded] = useState(Number.MAX_VALUE)
    const [loadedPosts, setLoadedPosts] = useState(0)
    const [, setNextLoadedPosts] = useState(FeedsManager.PAGE_SIZE)
    const [text, setText] = useState<string>("")

    const [selectedPostId, setSelectedPostId] = useState(0)
    const [selectedPostLoadingError, setSelectedPostLoadingError] = useState(false)

    const selectedPost = useLiveQuery(async () => selectedPostId && await feedsManager.getFeedPost(id, selectedPostId), [id, selectedPostId])

    const posts = useLiveQuery(async () => (
        !loading ? feedsManager.getFeedPosts(id, loadedPosts) : undefined
    ), [id, loadedPosts, loading])

    useLiveQuery(async () => {
        const generalLoad = await feedsManager.getGeneralLastLoad()
        setNeedFullReload(needFullReload => needFullReload || (baseLastLoad != -1 && baseLastLoad < generalLoad))
    }, [baseLastLoad])

    useEffect(() => {
        if (!loadingInformations){
            feedsManager.getLastPostedFresh(id).then(post => 
                setFirstLoaded(firstLoaded => post?.publicationDateId ?? firstLoaded)
            )
        }
    }, [loadingInformations, id])

    useEffect(() => {
        if (!loading) {
            feedsManager.subscribe(id).then(setBaseLastLoad).then(() => setGeneralLoading(false))
            return () => {
                feedsManager.unsubscribe(id)
            }
        }
    }, [id, loading])

    useEffect(() => {
        const splitted = location.pathname.split("/")
        splitted.shift()
        if (splitted.length >= 4 && splitted[2].toLowerCase() == "post") {
            const postId = +splitted[3]
            if (postId && !isNaN(postId))
                setSelectedPostId(postId)
        }
    }, [])

    useEffect(() => {
        if (!fetching && !loading && id && selectedPostId && (!selectedPost || !feedsManager.isFresh(selectedPost!, id))) {
            getFeedPost(id, selectedPostId)
                .then(async ({data: post}) => {
                    const currentPost = await feedsManager.getFeedPost(id, post.id)
                    if (!currentPost || !feedsManager.isFresh(currentPost, id))
                        feedsManager.addPostToFeed(post, id)
                }).catch(e => setSelectedPostLoadingError(true))
        }
    }, [id, fetching, loading, selectedPostId, selectedPost])


    const loadMorePost = useCallback(async () => {
        return new Promise<boolean>(resolve => {
            setFetching(true)
            setNextLoadedPosts(nextLoadedPosts => {
                setLoadedPosts(nextLoadedPosts);
                (async () => {
                    try {
                        if (nextLoadedPosts >= ((await feedsManager.countFreshFeedPosts(id)) ?? 0)) {
                            const resp = await feedsManager.loadMore(id)
                            if (resp[1] != Infinity) {
                                const loaded = await feedsManager.countFreshPostsAfter(id, resp[1])
                                setNextLoadedPosts(loaded + FeedsManager.PAGE_SIZE)
                                setLoadedPosts(loaded)
                                setFirstLoaded(firstLoaded => firstLoaded == Number.MAX_VALUE ? resp[2] : Math.max(firstLoaded, resp[2]))
                            }
                            setError(false)
                            setFetching(false)
                            resolve(resp[0])
                        } else {
                            setTimeout(async () => {
                                setNextLoadedPosts(nextLoadedPosts + FeedsManager.PAGE_SIZE)
                                const firstLoadedPost = await feedsManager.getLastPostedFresh(id)
                                if (firstLoadedPost)
                                    setFirstLoaded(firstLoaded => firstLoaded == Number.MAX_VALUE ? firstLoadedPost.publicationDateId : Math.max(firstLoaded, firstLoadedPost.publicationDateId))
                                resolve(false)
                            }, 300)
                        }
                    } catch (e) {
                        console.error("Error when fetching posts", e)
                        setError(true)
                        resolve(false)
                    }
                })()
                return nextLoadedPosts
            })
        })
    }, [id])

    const onPostCreation = useCallback((post: PostUpdate) => {
        setFirstLoaded(feedsManager.calcId(post))
        feedsManager.addPostToFeed(post, post.feedId)
    }, [])

    const onPostRemoval = useCallback(async (id: number) => {
        await feedsManager.deletePost(id)
        message.success(t("remove_item.complete"))
    }, [])

    const onPostPin = useCallback((postId: number, pinned: boolean, homepage?: boolean) => {
        if (pinned) {
            const index = (posts as ManagerPost[]).findIndex(p => p.id === postId)
            const pinnedPost = {...(posts as ManagerPost[])[index], [homepage ? "homepagePinned" : "pinned"]: true}

            // We move post into pinned posts while removing it from common posts
            if(!homepage || (homepage && !id)) {
                setPostsPinned(prev => (
                    [...prev, pinnedPost].sort((a, b) => (
                        a.publicationDate.getTime() - b.publicationDate.getTime()
                    )))
                )
                feedsManager.removePostFromLoadedFeed(pinnedPost.publicationDateId, id)
            }
            message.success(t("post:post_pinned"))
        } else {
            const index = postsPinned.findIndex(p => p.id === postId)
            const unpinnedPost = {...postsPinned[index], [homepage ? "homepagePinned" : "pinned"]: false}

            if(!homepage || (homepage && !id)) {
                // We move post into common posts while removing it from pinned posts
                setPostsPinned(prev => prev.filter((p, i) => i !== index))
                feedsManager.addPostToFeed(unpinnedPost, unpinnedPost.context.id)
            }
            message.success(t("post:post_unpinned"))
        }
    }, [posts, postsPinned, id])

    const onPostUpdate = useCallback(() => {
        setEditPost(0)
        message.success(t("update_item.complete"))
    }, [])

    useEffect(() => {
        if(!loading)
            getFeedPostPinned(id).then(res => {
                setPostsPinned(res.data)
            })
    }, [id, loading])

    const now = new Date()

    const loadAllPosts = useCallback(() => {
        if (posts)
            setFirstLoaded(posts.reduce((prev, post) => isBefore(post.publicationDate, new Date()) ? Math.max(prev, post.publicationDateId) : prev, 0))
    }, [posts])
    const fullReload = useCallback(async () => {
        setNeedFullReload(false)
        setFirstLoaded(Number.MAX_VALUE)
        await feedsManager.subscribe(id, true)
        setLoadedPosts(0)
        loadMorePost()
    }, [id])

    useEffect(() => {
        if(!loading)
            return feedsManager.fullReloadFromOtherTabs(id, () => 
                setNeedFullReload(false)
            )
    }, [id, loading])

    const [feedMargin, setFeedMargin] = useState(0)
    const feedElement = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const fnc = () => feedElement?.current && setFeedMargin(parseInt(getComputedStyle(feedElement?.current).marginLeft) * 2 + 1)

        fnc()
        window.addEventListener("resize", fnc)

        return () => window.removeEventListener("resize", fnc)
    }, [feedElement?.current])

    const toLoad = useMemo(() => (
        posts?.reduce((prev, post) => isBefore(post.publicationDate, now) && post.publicationDateId > firstLoaded ? prev + 1 : prev, 0)
    ), [posts, firstLoaded])

    const loadingSkeletons = useMemo(() => <CardTextSkeleton loading={true} number={5} className="my-3"/>, [])

    const empty = useMemo(() => (
        !loadingInformations && !fetching && !error && !posts?.length && !postsPinned?.length
    ), [loadingInformations, fetching, error, posts, postsPinned])

    return (
        <div
            className={`${className}`}
            style={{...style, maxWidth: `calc(100vw - ${feedMargin}px)`}}
            ref={feedElement}
        >
            {
                !!selectedPostId && <>
                    <Divider className="text-gray-700 text-lg" orientation="left">{t("post:selected_post")}</Divider>
                    {!selectedPost ? 
                        <CardTextSkeleton loading={true} number={1} className="my-0.5 shadow-md"/>
                        : <div
                            key={selectedPost.publicationDateId}
                            className={`${!feedsManager.isFresh(selectedPost, id) && "opacity-60 pointer-events-none"}`}
                        >
                            <Post
                                feedId={id}
                                data={selectedPost}
                                selected={true}
                                onDelete={onPostRemoval}
                                onUpdate={onPostUpdate}
                                onPin={onPostPin}
                                toggleEdition={(toggle) => setEditPost(toggle ? selectedPost.id : 0)}
                                isEdited={editPost === selectedPost.id}
                                className="shadow-md"
                            />
                        </div>
                    }
                </>
            }
            <Divider className="text-gray-700 text-lg" orientation="left">{t("posts")}</Divider>
            {allowPublication && (
                <BasicPostForm setText={setText} user={user} feed={id} onPost={onPostCreation}>
                    <div className="grid grid-cols-4 gap-2.5 items-center text-xl mt-1 -mb-2">
                        <div
                            onClick={() => setCompleteFormType(EmbedEnumType.IMAGE)}
                            className="w-10 h-10 justify-center items-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer group xsm"
                        >
                            <FontAwesomeIcon
                                icon={faImages}
                                className="text-gray-700 text-opacity-60 mx-1 group-hover:text-opacity-100 transition-colors"
                            />
                        </div>
                        <div
                            onClick={() => setCompleteFormType(EmbedEnumType.VIDEO)}
                            className="w-10 h-10 justify-center items-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer group xsm"
                        >
                            <FontAwesomeIcon
                                icon={faVideo}
                                className="text-gray-700 text-opacity-60 mx-1 group-hover:text-opacity-100 transition-colors"
                            />
                        </div>
                        <div
                            onClick={() => setCompleteFormType(EmbedEnumType.DOCUMENT)}
                            className="flex w-10 h-10 justify-center items-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer group xsm-span"
                        >
                            <FontAwesomeIcon
                                icon={faPaperclip}
                                className="text-gray-700 text-opacity-60 mx-1 group-hover:text-opacity-100 transition-colors"
                            />
                        </div>
                        <div
                            onClick={() => setCompleteFormType(EmbedEnumType.POLL)}
                            className="flex w-10 h-10 justify-center items-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer group xsm-span"
                        >
                            <FontAwesomeIcon
                                icon={faChartBar}
                                className="text-gray-700 text-opacity-60 mx-1 group-hover:text-opacity-100 transition-colors"
                            />
                        </div>
                        {completeFormType && (
                            <Modal
                                className="md:w-1/2 w-4/5"
                                visible={true}
                                footer={null}
                                title={<span className="text-gray-800 font-bold text-2xl">{t("post:create")}</span>}
                                onCancel={() => setCompleteFormType(undefined)}
                            >
                                <PostCreateForm
                                    text={text}
                                    type={completeFormType}
                                    feed={id}
                                    user={user}
                                    onSubmit={onPostCreation}
                                    onClose={() => setCompleteFormType(undefined)}
                                />
                            </Modal>
                        )}
                    </div>
                </BasicPostForm>
            )}

            {(!!toLoad || needFullReload) &&
                <div
                    onClick={needFullReload ? fullReload : loadAllPosts}
                    className="
                        ant-divider ant-divider-horizontal ant-divider-with-text
                        ant-divider-with-text-center text-gray-700 text-opacity-60 text-base
                        cursor-pointer hover:bg-gray-500 hover:bg-opacity-5 p-2 rounded-lg transition-colors
                    "
                >
                    <div className="ant-divider-inner-text">
                        {needFullReload ? t("post:full_reload") : t("post:new_posts", {toLoad})}
                    </div>
                </div>
            }
            {loadingInformations ? loadingSkeletons :
                <InfiniteScroller
                    block={error}
                    triggerDistance={500}
                    watch="DOWN" callback={loadMorePost} empty={empty}
                    loadingComponent={error || loadingSkeletons}
                >
                    {empty ?
                        <div className="mt-10 mb-2 flex flex-col items-center justify-center text-xl text-gray-400">
                            <FontAwesomeIcon icon={faNewspaper} size="8x" className="block"/>
                            <span className="text-center">{t("empty_feed")}</span>
                        </div>
                        : (
                            <>
                                {postsPinned.length !== 0 && (
                                    <>
                                        {postsPinned.map(p => (
                                            <Post
                                                feedId={id}
                                                key={p.id} data={p as ManagerPost}
                                                onDelete={onPostRemoval}
                                                onUpdate={onPostUpdate}
                                                onPin={onPostPin}
                                                toggleEdition={(toggle) => setEditPost(toggle ? p.id : 0)}
                                                isEdited={editPost === p.id}
                                            />
                                        ))}
                                        <Divider className="text-gray-700"/>
                                    </>
                                )}

                                {posts?.map(p => ((isAfter(p.publicationDate, now) || p.publicationDateId <= firstLoaded) && (!error || feedsManager.isFresh(p, id)) &&
                                    <div
                                        key={p.publicationDateId}
                                        className={!feedsManager.isFresh(p, id) ? "opacity-60 pointer-events-none" : ""}
                                    >
                                        <Post
                                            feedId={id}
                                            data={p}
                                            onDelete={onPostRemoval}
                                            onUpdate={onPostUpdate}
                                            onPin={onPostPin}
                                            toggleEdition={(toggle) => setEditPost(toggle ? p.id : 0)}
                                            isEdited={editPost === p.id}
                                        />
                                    </div>
                                ))}
                                {error && (
                                    <div className="flex flex-col text-center">
                                        <label className="text-neutral-800">{t("error:no_connection_retry")}</label>
                                        <div className="flex justify-center mt-2">
                                            <button
                                                onClick={loadMorePost}
                                                className="
                                                    bg-indigo-400 rounded-full px-4 py-2 font-semibold text-base
                                                    text-white hover:bg-indigo-500 hover:shadow-sm transition-all
                                                "
                                            >
                                                {t("retry")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    }
                </InfiniteScroller>
            }
        </div>
    )
}

Feed.defaultProps = {
    allowPublication: true,
    className: "",
}

export default Feed
