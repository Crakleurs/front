import React, {useEffect, useMemo, useReducer} from "react"
import {useParams} from "react-router"
import {getClub, getClubMembers} from "../../../data/club"
import {message, Skeleton} from "antd"
import {useHistory} from "react-router-dom"
import ClubNavbar from "../../../components/Club/Mobile/ClubNavbar"
import ClubCover from "../../../components/Club/ClubDescription/ClubCover"
import SocialIcon from "../../../components/Common/SocialIcon"
import SidePanelMembers from "../../../components/Club/Desktop/SidePanelMembers"
import Feed from "../../../components/Feed"
import ClubPresentation from "../../../components/Club/ClubDescription/ClubPresentation"
import ClubAdmin from "../../../components/Club/ClubAdmin"
import ClubLogo from "../../../components/Club/ClubLogo"
import {clubContextReducer} from "../../../context/club/reducer"
import {ClubContext, DEFAULT_STATE} from "../../../context/club/context"
import {ClubActionType} from "../../../context/club/action"
import {faSignOutAlt, faTools} from "@fortawesome/free-solid-svg-icons"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faFacebook, faFirefox, faInstagram, faSnapchat} from "@fortawesome/free-brands-svg-icons"

interface ParamTypes {
    id?: string
}

const Club: React.FC = () => {
    const {id: idStr} = useParams<ParamTypes>()
    const id = useMemo(() => parseInt(idStr || ""), [idStr])
    const history = useHistory()
    const [state, dispatch] = useReducer(clubContextReducer, DEFAULT_STATE)

    /**
     * Club initialisation on mounting
     */
    useEffect(() => {
        if (!isNaN(id)) {
            dispatch({type: ClubActionType.FETCH_CLUB})
            getClub(+id)
                .then(res => {
                    dispatch({type: ClubActionType.GET_CLUB, payload: res.data})
                })
                .catch(e => message.error(e))
            //.finally(() => setClubLoading(false))
        } else {
            history.push("404")
        }
    }, [id])


    // Updated function called when respective tab is active
    useEffect(() => {
        if (state.club.data) {
            dispatch({type: ClubActionType.FETCH_MEMBERS})
            getClubMembers(state.club.data.id)
                .then(res => {
                    dispatch({type: ClubActionType.GET_MEMBERS, payload: res.data})
                })
                .catch(e => message.error(e))
            //.finally(() => setMembersLoading(false))
        }
    }, [state.club.data])

    return (
        <ClubContext.Provider value={{state, dispatch}}>
            <div className="w-full h-full ">
                <ClubCover/>
                <div className="flex justify-between container p-3 mx-auto">
                    <div className="flex">
                        <ClubLogo/>
                        <div className="flex flex-col ml-4 md:mt-0 -mt-4">
                            {state.club.loading || !state.club.data ?
                                <>
                                    <Skeleton className="w-64" active title paragraph={false}/>
                                    <Skeleton className="w-32" active title paragraph={false}/>
                                </> :
                                <>
                                    <h1 className="text-gray-700 text-3xl mb-0 font-bold">{state.club.data.name}</h1>
                                    <h4 className="text-gray-500 text-md italic">{new Date(state.club.data.creation).toLocaleDateString()}</h4>
                                </>
                            }
                        </div>
                        {state.adminMode && <h1 className="ml-5 my-auto font-dinotcb text-2xl text-gray-700">Panel administration</h1>}
                    </div>
                    {state.club.data &&
                    <div className="flex flex-wrap items-center" style={{height: "min-content"}}>
                        {state.club.data.website && <SocialIcon icon={faFirefox} url={state.club.data.website}/>}
                        {state.club.data.facebook && <SocialIcon  icon={faFacebook} url={state.club.data.facebook}/>}
                        {state.club.data.instagram && <SocialIcon  icon={faInstagram} url={state.club.data.instagram}/>}
                        {state.club.data.snapchat && <SocialIcon  icon={faSnapchat} url={state.club.data.snapchat}/>}
                        {state.club.data.canEdit && (
                            <span className="text-gray-700 hover:text-gray-500 cursor-pointer font-bold mt-5 mr-5 " onClick={() => dispatch({type: ClubActionType.TOGGLE_ADMIN_MODE})}>
                                Administration
                                <FontAwesomeIcon
                                    icon={state.adminMode ? faSignOutAlt: faTools}
                                    size="lg"
                                    className="ml-3"
                                />
                            </span>
                        )}
                    </div>
                    }
                </div>


                <div key="desktop-display" className="hidden md:flex flex-row -mt-10 pt-10 px-5">
                    {state.adminMode && state.club.data ?
                        <ClubAdmin/> :
                        <>
                            <ClubPresentation/>
                            <div className="flex-grow">
                                {state.club.data &&
                                <Feed id={state.club.data.feed} allowPublication={false} className="m-4 hidden md:block"/>
                                }
                            </div>

                            <SidePanelMembers/>
                        </>
                    }
                </div>

                <ClubNavbar key="mobile-display"/>
            </div>
        </ClubContext.Provider>
    )
}

export default Club