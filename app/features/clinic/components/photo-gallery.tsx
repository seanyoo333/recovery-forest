import { Download, ExternalLink, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { DialogHeader, DialogTitle } from "~/core/components/ui/dialog";

interface ClinicPhoto {
  photo_id: number;
  photo_url: string;
  photo_type: "exterior" | "interior" | "equipment" | "staff" | "other";
  photo_title?: string;
  photo_description?: string;
  is_primary: boolean;
  created_at: string;
}

interface PhotoGalleryProps {
  photos?: ClinicPhoto[];
  onDeletePhoto?: (photoId: number) => void;
  canEdit?: boolean;
}

const photoTypeLabels = {
  exterior: "외부",
  interior: "내부",
  equipment: "장비",
  staff: "직원",
  other: "기타",
};

export function PhotoGallery({
  photos,
  onDeletePhoto,
  canEdit = false,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ClinicPhoto | null>(null);

  // photos가 undefined이거나 null인 경우 빈 배열로 처리
  const safePhotos = photos || [];

  const groupedPhotos = safePhotos.reduce(
    (acc, photo) => {
      if (!acc[photo.photo_type]) {
        acc[photo.photo_type] = [];
      }
      acc[photo.photo_type].push(photo);
      return acc;
    },
    {} as Record<string, ClinicPhoto[]>,
  );

  const handleDelete = (photoId: number) => {
    if (onDeletePhoto && confirm("이 사진을 삭제하시겠습니까?")) {
      onDeletePhoto(photoId);
    }
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (safePhotos.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p>등록된 사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {photoTypeLabels[type as keyof typeof photoTypeLabels]} 사진
            </h3>
            <Badge variant="secondary">{typePhotos.length}장</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typePhotos.map((photo) => (
              <div key={photo.photo_id} className="group relative">
                <div className="bg-muted aspect-video overflow-hidden rounded-lg">
                  <img
                    src={photo.photo_url}
                    alt={
                      photo.photo_title ||
                      `${photoTypeLabels[photo.photo_type]} 사진`
                    }
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />

                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDelete(photo.photo_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  {photo.is_primary && (
                    <Badge className="absolute top-2 left-2">대표</Badge>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {photo.photo_title && (
                    <p className="text-sm font-medium">{photo.photo_title}</p>
                  )}
                  {photo.photo_description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {photo.photo_description}
                    </p>
                  )}

                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          보기
                        </Button>
                      </DialogTrigger>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadImage(
                          photo.photo_url,
                          photo.photo_title ||
                            `clinic_photo_${photo.photo_id}.jpg`,
                        )
                      }
                    >
                      <Download className="mr-1 h-3 w-3" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 사진 상세 보기 모달 */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>사진 상세 보기</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="bg-muted aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedPhoto.photo_url}
                  alt={
                    selectedPhoto.photo_title ||
                    `${photoTypeLabels[selectedPhoto.photo_type]} 사진`
                  }
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {photoTypeLabels[selectedPhoto.photo_type]}
                  </Badge>
                  {selectedPhoto.is_primary && <Badge>대표 사진</Badge>}
                </div>

                {selectedPhoto.photo_title && (
                  <h3 className="text-lg font-semibold">
                    {selectedPhoto.photo_title}
                  </h3>
                )}

                {selectedPhoto.photo_description && (
                  <p className="text-muted-foreground">
                    {selectedPhoto.photo_description}
                  </p>
                )}

                <p className="text-muted-foreground text-sm">
                  업로드:{" "}
                  {new Date(selectedPhoto.created_at).toLocaleDateString(
                    "ko-KR",
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
