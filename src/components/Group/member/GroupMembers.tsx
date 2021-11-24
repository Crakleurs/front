import React, {useCallback, useEffect, useState} from "react"
import {message, Skeleton} from "antd"
import MemberList from "../MemberList"
import {useTranslation} from "react-i18next"
import {GroupMember} from "../../../data/group/types"
import AdminAction from "./AdminAction"
import MemberAction from "./MemberAction"
import {addGroupMember, deleteGroupMember, demoteGroupMember, getGroupMembers, promoteGroupMember} from "../../../data/group"
import AddMember from "./AddMember"
import CompressedMembers from "../../Common/CompressedMembers"

type GroupMembersProps = {
    group: number
    orga: GroupMember[][]
    onAdd: (id: number) => void
    onDemote: (id: number) => () => void
    onDelete: (id: number) => () => void
    loading: boolean
    hasRight?: boolean
}
const GroupMembers: React.FC<GroupMembersProps> = ({group, orga, onAdd, onDemote, onDelete, loading, hasRight = false}) => {
    const {t} = useTranslation("group")

    return (
        loading ?
            <>
                <Skeleton title paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>

                <Skeleton title paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>
                <Skeleton avatar paragraph={{rows: 0}}/>
            </> :
            <div>
                <h3 className="text-gray-800 text-lg mt-3 mb-1">{t("admins")}</h3>
                <MemberList
                    members={orga[0]}
                    actions={id => <AdminAction onDelete={onDelete(id)} onDemote={onDemote(id)}/>}
                />

                {!!orga[1].length &&
                    <>
                        <h3 className="text-gray-800 text-lg mt-3">{t("members")}</h3>
                        {hasRight && <AddMember onAdd={onAdd} />}<CompressedMembers className="cursor-pointer hover:bg-black hover:bg-opacity-5 transition-colors rounded-lg p-2 w-full" members={orga[1].map(member => member.student)} />
                    </>
                }
            </div>
    )
}

export default GroupMembers