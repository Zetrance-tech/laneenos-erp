import React, { useState } from "react";
import { Upload, Button, message, Form } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

interface Props {
  id: string; // Teacher's custom 'id' field
  onUploadSuccess: () => void;
}

const TeacherProfileUpload: React.FC<Props> = ({ id, onUploadSuccess }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const {token} = useAuth();
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Please select an image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePhoto", fileList[0]);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/api/teacher/${id}/profile-photo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      message.success("Profile photo uploaded successfully!");
      onUploadSuccess(); // Refetch data and close modal
    } catch (error) {
      message.error("Upload failed. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const props = {
    beforeUpload: (file: File) => {
      setFileList([file]); // Only one image allowed
      return false; // Prevent automatic upload
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    accept: "image/*",
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Select Profile Photo">
        <Upload {...props} maxCount={1}>
          <Button icon={<UploadOutlined />}>Choose File</Button>
        </Upload>
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          loading={uploading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          Upload
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TeacherProfileUpload;