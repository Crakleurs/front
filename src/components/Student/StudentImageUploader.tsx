import React, {useCallback, useContext, useEffect, useState} from "react"
import ImagePicker from "../Common/ImagePicker"
import {useTranslation} from "react-i18next"
import {Avatar, Button, message, Upload} from "antd"
import {mediaPath} from "../../util"
import {AvatarSizes} from "../../constants/MediaSizes"
import {updateCustomPicture} from "../../data/student"
import {StudentPicture} from "../../data/student/types"
import {AppContext} from "../../context/app/context"
import {AppActionType} from "../../context/app/action"
import {faUpload} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {faSave, faUser} from "@fortawesome/free-regular-svg-icons"

type StudentImageUploaderProps = {
    original?: string
    custom?: string
    onUpdate?: (pictures: StudentPicture) => void
}

const StudentImageUploader: React.FC<StudentImageUploaderProps> = ({original, custom, onUpdate}) => {
    const {t} = useTranslation(["setting", "common"])
    const {dispatch} = useContext(AppContext)
    const [file, setFile] = useState<File | null>()
    const [fileStr, setFileStr] = useState<string>()

    const handleImage = useCallback((file: File) => {
        setFile(file)
        return false
    }, [])

    useEffect(() => {
        if(file) {
            const reader = new FileReader()
            reader.onload = e => setFileStr(reader.result as string)

            reader.readAsDataURL(file)
        }else {
            setFileStr(undefined)
        }
    }, [file])

    const handleSubmit = useCallback(() => {
        if(file !== undefined){
            updateCustomPicture(file).then(res => {
                message.success(t("picture_updated"))
                dispatch({ type: AppActionType.SET_PICTURE, payload: res.data })
                setFile(undefined)
            }).catch(() => message.error((t("common:error"))))
        }else{
            message.error((t("common:error")))
        }
    }, [file])

    return (
        <div className="flex flex-col items-center justify-between p-8 border-dashed border-2 border-gray-400 rounded-lg h-64 relative">
            {fileStr || custom ?
                <>
                    <ImagePicker
                        defaultImage={mediaPath(custom, AvatarSizes.DEFAULT) || fileStr}
                        className="avatar-squared rounded"
                        onReset={() => setFile(undefined)}
                        onChange={setFile}

                    />
                    <div
                        className="absolute h-16 w-16 text-center"
                        style={{bottom: 5, right: 5}}
                    >
                        {t("default")}
                        <Avatar
                            src={mediaPath(original, AvatarSizes.DEFAULT)}
                            icon={<FontAwesomeIcon icon={faUser}/>}
                            className="rounded"
                        />
                    </div>

                    {file !== undefined && (
                        <Button className="bg-green-400 text-green-700 hover:text-green-800 rounded-lg" onClick={handleSubmit}>
                            {t("common:save")} <FontAwesomeIcon icon={faSave} className="ml-2" />
                        </Button>
                    )}
                </> :
                <>
                    <Avatar
                        src={mediaPath(original, AvatarSizes.DEFAULT)}
                        icon={<FontAwesomeIcon icon={faUser}/>}
                        className="rounded"
                        size={135}
                    />
                    <Upload beforeUpload={handleImage}>
                        <Button
                            style={{width: "max-content"}}
                            className="rounded-lg border-2 border-gray-600 text-gray-600 hover:text-gray-600"
                        >
                            {t("add_picture")} <FontAwesomeIcon icon={faUpload} className="ml-2"/>
                        </Button>
                    </Upload>
                </>
            }
        </div>
    )
}

export default StudentImageUploader
