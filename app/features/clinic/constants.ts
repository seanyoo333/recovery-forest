export const CLINIC_TYPES = [
    {
      label: "대학병원",
      value: "university",
    },
    {
      label: "기능의학 병원",
      value: "functional",
    },
    {
      label: "요양병원",
      value: "nursing",
  },
  {
     label: "한의원",
     value: "traditional",
},
] as const;

export const LOCATION_TYPES = [
  {
    label: "서울",
    value: "seoul",
  },
  {
    label: "경기도",
    value: "gyeonggi",
  },
  {
    label: "부산",
    value: "busan",
  },
] as const;

export const LEVELS = [
  "1",
  "2",
  "3",
  "4",
  "5",
] as const; 