import { useState, useRef } from "react";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  clinicId: number;
  onUploadComplete: (imageData: any) => void;
  onUploadError: (error: string) => void;
}

export function ImageUpload({ clinicId, onUploadComplete, onUploadError }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<'exterior' | 'interior' | 'equipment' | 'staff' | 'other'>('exterior');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        onUploadError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        onUploadError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      setSelectedFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onUploadError('업로드할 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clinicId', clinicId.toString());
      formData.append('photoType', photoType);
      formData.append('photoTitle', photoTitle);
      formData.append('photoDescription', photoDescription);
      formData.append('isPrimary', isPrimary.toString());
      
      // API 엔드포인트로 업로드
      const response = await fetch('/api/clinic/upload-photo', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '업로드에 실패했습니다.');
      }
      
      onUploadComplete(result.photo);
      
      // 폼 초기화
      setSelectedFile(null);
      setPhotoTitle('');
      setPhotoDescription('');
      setIsPrimary(false);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="photo-type">사진 타입</Label>
        <Select value={photoType} onValueChange={(value: any) => setPhotoType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="사진 타입을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exterior">외부 사진</SelectItem>
            <SelectItem value="interior">내부 사진</SelectItem>
            <SelectItem value="equipment">장비 사진</SelectItem>
            <SelectItem value="staff">직원 사진</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-title">사진 제목 (선택사항)</Label>
        <Input
          id="photo-title"
          value={photoTitle}
          onChange={(e) => setPhotoTitle(e.target.value)}
          placeholder="사진 제목을 입력하세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-description">사진 설명 (선택사항)</Label>
        <Textarea
          id="photo-description"
          value={photoDescription}
          onChange={(e) => setPhotoDescription(e.target.value)}
          placeholder="사진에 대한 설명을 입력하세요"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="is-primary">대표 사진으로 설정</Label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-primary"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="is-primary" className="text-sm">
            이 사진을 병원의 대표 사진으로 설정합니다
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload">이미지 파일</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="flex-1"
          />
          {selectedFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="space-y-2">
          <Label>미리보기</Label>
          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="미리보기"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="h-4 w-4 mr-2 animate-spin" />
            업로드 중...
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 mr-2" />
            사진 업로드
          </>
        )}
      </Button>
    </div>
  );
} 