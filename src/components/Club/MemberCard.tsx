import React, {useMemo} from "react"
import {ClubMember, ClubRole} from "../../data/club/types"
import {Tooltip} from "antd"
import {useHistory} from "react-router-dom"
import {IconFA} from "../Common/IconFA"
import {AvatarSizes} from "../../constants/MediaSizes"
import StudentAvatar from "../Student/StudentAvatar"

const ClubRoleIcon: { [role: string]: string } = {
    [ClubRole.ADMIN]: "fa-user-shield",
    [ClubRole.PUBLISHER]: "fa-edit",
}

type MemberCardProps = {
    id: number
    m: ClubMember
    showRole?: boolean
    onClick?: (id: number) => void
}
const MemberCard: React.FC<MemberCardProps> = React.memo(({id, m, onClick, showRole = false}) => {
    const history = useHistory()
    const handleClick = useMemo(() => (onClick ?
        () => onClick(id) :
        () => history.replace(`${history.location.pathname}/student/${m.student.id}`)
    ), [id, onClick])

    return (
        <div
            onClick={handleClick}
            className="h-16 m-auto md:m-2 cursor-pointer hover:opacity-50 shadow-md flex flex-row items-center bg-white rounded-lg md:w-64 mb-4"
        >
            <StudentAvatar
                id={m.student.id}
                name={m.student.firstName + "" + m.student.lastName}
                picture={m.student.picture}
                className="m-3"
            />
            <div className="flex flex-col flex-no-wrap ml-2">
                <Tooltip title={`${m.student.firstName} ${m.student.lastName}`}>
                    <div className="text-lg md:text-sm lg:text-sm xl:text-sm font-bold truncate w-40 xl:w-32 lg:w-32 md:w-32">{m.student.firstName} {m.student.lastName}</div>
                </Tooltip>
                <div className="italic">{m.position} {showRole && <IconFA className="ml-2" name={ClubRoleIcon[m.role]}/>}</div>
            </div>
        </div>
    )
})
MemberCard.displayName = "MemberCard"

export default MemberCard