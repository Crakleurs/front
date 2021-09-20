import React, {useCallback, useContext} from "react"
import {ClubMember, ClubMemberForm, ClubRoles} from "../../../data/club/types"
import {Button, Input, message, Modal, Select} from "antd"
import {useTranslation} from "react-i18next"
import {useFormik} from "formik"
import {removeClubMember, updateClubMember} from "../../../data/club"
import {ClubContext} from "../../../context/club/context"
import {ClubActionType} from "../../../context/club/action"
import StudentAvatar from "../../Student/StudentAvatar"
import {faTimes} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {faSave, faTrashAlt} from "@fortawesome/free-regular-svg-icons"

const {Option} = Select

type ClubMemberEditorProps = {
    member: ClubMember
    onCancel: () => void
}
const ClubMemberEditor: React.FC<ClubMemberEditorProps> = ({member, onCancel}) => {
    const {t} = useTranslation(["club", "common"])
    const {dispatch} = useContext(ClubContext)
    const remove = useCallback(() =>
        Modal.confirm({
            title: t("remove_member.title"),
            content: t("remove_member.content"),
            okText: "Ok",
            cancelText: t("cancel"),
            onOk: async () => {
                const res = await removeClubMember(member.id)
                if (res.status === 200){
                    message.success(t("remove_member.complete"))
                    dispatch({type: ClubActionType.REMOVE_MEMBER, payload: member.id})
                }

            }
        }), [t, member])

    const formik = useFormik<ClubMemberForm>({
        enableReinitialize: true,
        initialValues: {
            role: member.role,
            position: member.position
        },
        onSubmit: async (values) => {
            const res = await updateClubMember(member.id, values)
            if(res.status === 200){
                message.success(t("common:update_item.complete"))
                dispatch({type: ClubActionType.UPDATE_MEMBER, payload: res.data})
            }
        }
    })

    return (
        <div className="h-full">
            <div className="w-full flex justify-between items-center">
                <h1 className="font-dinotcb text-xl text-gray-600 uppercase">{t("edit_member")}</h1>
                <FontAwesomeIcon icon={faTimes} className="text-gray-600 hover:text-gray-400 cursor-pointer" onClick={onCancel}/>
            </div>

            <form className="flex flex-col items-center -mt-3 p-3 h-full" onSubmit={formik.handleSubmit}>
                <div className="text-center">
                    <StudentAvatar
                        id={member.student.id}
                        name={member.student.firstName + "" + member.student.lastName}
                        picture={member.student.picture}
                        className="h-16 w-16 md:h-12 md:w-12 m-3"
                    />
                    <h3 className="font-dinotcb text-xl text-gray-500">{member.student.firstName + " " + member.student.lastName}</h3>
                </div>

                <div className="flex flex-col items-center mb-3">
                    <label className="font-dinotcb">{t("form.role")}</label>
                    <Select value={formik.values.role} className="w-32" onChange={(value) => formik.setFieldValue("role", value)}>
                        {ClubRoles.map(r =>
                            <Option key={r} value={r}>{t("role." + r)}</Option>
                        )}
                    </Select>
                </div>
                <div>
                    <label className="font-dinotcb">{t("form.position")}</label>
                    <Input name="position" value={formik.values.position} onChange={formik.handleChange}/>
                </div>

                <div className="self-end flex flex-wrap justify-around w-full mt-4">
                    <Button
                        htmlType="submit"
                        type="primary"
                        className="rounded"
                        icon={<FontAwesomeIcon icon={faSave} className="mr-2"/>}
                    >
                        {t("common:save")}
                    </Button>
                    <Button
                        danger
                        className="rounded"
                        icon={<FontAwesomeIcon icon={faTrashAlt} className="mr-2"/>}
                        onClick={remove}
                    >
                        {t("common:delete")}
                    </Button>
                </div>
            </form>

        </div>
    )
}

export default ClubMemberEditor