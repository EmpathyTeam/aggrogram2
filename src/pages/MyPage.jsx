import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAggrogram } from "../contexts/AggrogramContext";
import styled from "styled-components";
import { supabase } from "../configs/supabaseConfig";
import { getFormatDate } from "../utils/formatDate"; // Supabase 설정 파일 import
import PostList from "../components/posts/PostList";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const MyPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, posts, setUser } = useAggrogram();
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState("");

  // const paramsId = searchParams.get("id");

  useEffect(() => {
    if (user) {
      setNewNickname(user.user_metadata.nickname);
      setNewDescription(user.user_metadata.description);
      setNewAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      setNewAvatarUrl(URL.createObjectURL(file));
    }
  };

  const getImageUrl = (fullPath) => {
    return `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`;
  };

  const handleSaveClick = async () => {
    let imgUrl = newAvatarUrl;

    if (newAvatarFile) {
      const imgName = `${user.id}_${getFormatDate()}`;

      const { data, error: uploadError } = await supabase.storage.from("avatarImg").upload(imgName, newAvatarFile, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) {
        console.error("이미지 업로드 오류:", uploadError);
        return;
      }
      imgUrl = getImageUrl(data.fullPath);
    }
    const updates = {
      avatar_url: imgUrl,
      nickname: newNickname,
      description: newDescription
    };

    // Supabase 업데이트 호출
    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      console.error("프로필 업데이트 오류:", error);
    } else {
      // 상태 업데이트
      setUser((prevUser) => ({
        ...prevUser,
        user_metadata: {
          ...prevUser.user_metadata,
          ...updates
        }
      }));
      setIsEditing(false);
    }
  };

  return (
    <Section>
      {!user ? (
        <div>정보를 불러 올 수 없음</div>
      ) : (
        <>
          <ProfileContainer>
            <ProfileImage
              src={
                newAvatarUrl ||
                "https://untacqjpmvnegdbefbrr.supabase.co/storage/v1/object/public/avatarImg/m_20220509173224_d9N4ZGtBVR.jpeg"
              }
            />
            {isEditing ? (
              <>
                <ProfileInfo>
                  <input
                    className="nickname-input"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                  />
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                  <label htmlFor="file-upload" className="file-label">
                    이미지 파일첨부
                  </label>
                  <input id="file-upload" type="file" onChange={handleFileChange} />
                </ProfileInfo>
                <SaveButton onClick={handleSaveClick}>저장</SaveButton>
              </>
            ) : (
              <>
                <ProfileInfo>
                  <Nickname>{user.user_metadata.nickname}</Nickname>
                  <Description>
                    {user.user_metadata.description || "자기소개를 회원정보 수정 페이지에서 추가해보세요."}
                  </Description>
                </ProfileInfo>
                <EditButton onClick={handleEditClick}>프로필 수정</EditButton>
              </>
            )}
          </ProfileContainer>

          <SectionTitle>{user.user_metadata.nickname}님의 게시글</SectionTitle>
          {/* <PostsContainer>
            {posts.filter((post) => post.user_id === paramsId).length > 0 ? (
              posts
                .filter((post) => post.user_id === paramsId)
                .map((post) => (
                  <PostCard key={post.id}>
                    <img src={post.img_url} alt={post.title} />
                    <h4>{post.title}</h4>
                  </PostCard>
                ))
            ) : (
              <p>게시글이 없습니다.</p>
            )}
          </PostsContainer> */}
          <PostList isMyPage={true} />
        </>
      )}
    </Section>
  );
};

export default MyPage;

// const PostsContainer = styled.div`
//   display: flex;
//   flex-wrap: wrap;
//   gap: 20px;
//   padding: 20px;
//   box-sizing: border-box;
// `;

// const PostCard = styled.div`
//   flex: 1 1 250px;
//   background-color: #fff;
//   max-width: 250px;
//   border: 1px solid #e1e1e1;
//   border-radius: 8px;
//   overflow: hidden;
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//   transition: transform 0.2s ease;
//   box-sizing: border-box;

//   &:hover {
//     transform: translateY(-5px);
//   }

//   img {
//     width: 100%;
//     height: 150px;
//     object-fit: cover;
//   }

//   h4 {
//     font-size: 1em;
//     margin: 10px;
//     text-align: center;
//   }
// `;

const Section = styled.section`
  width: 1340px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const SectionTitle = styled.h3`
  font-size: 2em;
  text-align: center;
  margin: 40px 0;
`;

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 20px;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 20px;
  object-fit: cover;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  input[type="text"],
  textarea {
    width: 90%;
    padding: 5px;
    margin-bottom: 15px;
    font-size: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin: 10px;
  }

  .nickname-input {
    text-align: center;
    padding: 5px;
  }

  textarea {
    resize: none;
    height: 80px;
  }

  input[type="file"] {
    display: none;
  }

  .file-label {
    display: inline-block;
    padding: 10px 20px;
    font-size: 16px;
    color: #fc913a;
    background-color: #ffffff;
    border-radius: 5px;
    cursor: pointer;
    margin-bottom: 15px;
    text-align: center;
    border: 1px solid #fc913a;
    font-weight: 700;
  }
`;

const Nickname = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
`;

const Description = styled.p`
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
  padding: 0 10px;
`;

const EditButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: #fc913a;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const SaveButton = styled(EditButton)`
  background-color: #fc913a;
  &:hover {
    background-color: #fc913a;
  }
`;
