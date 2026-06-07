export const teams = [
  {
    id: "kyoto",
    name: "关西四日轻旅行",
    destination: "大阪 / 京都",
    dates: "6月12日 - 6月16日",
    members: ["阿杰", "Mia", "橙子", "Leo"],
    status: "偏好收集中",
    progress: 62,
  },
  {
    id: "dali",
    name: "大理慢游计划",
    destination: "大理",
    dates: "7月4日 - 7月8日",
    members: ["阿杰", "小雨", "Nora"],
    status: "行程规划中",
    progress: 78,
  },
];

export const btiQuestions = [
  ["旅行节奏", "我更喜欢每天安排紧凑一些", "我更喜欢慢慢逛，留白多一点"],
  ["目的地选择", "我愿意尝试小众路线", "我更偏好成熟经典路线"],
  ["预算态度", "体验优先，预算可弹性", "预算清晰，提前算好更安心"],
  ["团队协作", "我喜欢主动做攻略", "我更喜欢确认别人整理好的方案"],
];

export const itineraryDays = [
  {
    day: "Day 1",
    title: "抵达大阪",
    items: ["关西机场集合", "难波入住", "道顿堀晚餐"],
  },
  {
    day: "Day 2",
    title: "京都城市散步",
    items: ["伏见稻荷大社", "清水寺", "鸭川夜景"],
  },
  {
    day: "Day 3",
    title: "自由分组探索",
    items: ["岚山小火车", "咖啡店清单", "伴手礼采购"],
  },
];

export const itineraryPlanningMock = {
  team: {
    id: "hangzhou-2025",
    name: "国庆杭州旅行",
    destination: "杭州",
    dateRange: "10月1日 - 10月3日",
    duration: "3天",
    memberCount: 8,
    status: "行程规划中",
  },
  days: [
    {
      id: "day-1",
      label: "Day 1",
      date: "10月1日",
      weekday: "周三",
      stops: [
        {
          id: "west-lake",
          title: "西湖风景区",
          tag: "5A景区",
          address: "杭州市西湖区龙井路1号",
          note: "建议慢慢逛，经典路线：苏堤 -> 白堤 -> 断桥",
          owner: "Laow",
        },
        {
          id: "beishan-street",
          title: "北山街历史文化街区",
          tag: "历史文化街区",
          address: "杭州市西湖区北山街",
          note: "沿湖有很多特色小店和咖啡馆",
          owner: "小林",
        },
        {
          id: "grandma-home",
          title: "外婆家（湖滨店）",
          tag: "杭帮菜",
          address: "杭州市上城区湖滨路3号",
          note: "本地杭帮菜，适合多人聚餐",
          owner: "阿杰",
        },
        {
          id: "zhejiang-museum",
          title: "浙江省博物馆（孤山馆区）",
          tag: "博物馆",
          address: "杭州市西湖区孤山路25号",
          note: "了解浙江历史文化，建议提前预约",
          owner: "小林",
        },
      ],
    },
    {
      id: "day-2",
      label: "Day 2",
      date: "10月2日",
      weekday: "周四",
      stops: [
        {
          id: "qingshan-lake",
          title: "青山湖国家森林公园",
          tag: "自然风光",
          address: "杭州市临安区青山湖街道",
          note: "山水风景，适合放松散步",
          owner: "阿杰",
        },
        {
          id: "linan-old-street",
          title: "临安老街",
          tag: "历史文化街区",
          address: "杭州市临安区中山街",
          note: "逛老街，品尝当地小吃",
          owner: "Laow",
        },
      ],
    },
    {
      id: "day-3",
      label: "Day 3",
      date: "10月3日",
      weekday: "周五",
      stops: [
        {
          id: "nanhu-scenic-area",
          title: "南湖景区",
          tag: "自然风光",
          address: "杭州市余杭区南湖街道",
          note: "湖光山色，适合轻松游玩",
          owner: "小林",
        },
        {
          id: "return-trip",
          title: "返程",
          tag: "交通",
          address: "根据返程时间安排",
          note: "注意预留路上时间",
          owner: "Laow",
          transport: true,
        },
      ],
    },
  ],
  placePreview: {
    title: "西湖风景区",
    tag: "5A景区",
    address: "杭州市西湖区龙井路1号",
    note: "中国著名湖泊景区，风景秀丽，适合漫游",
  },
  suggestions: [
    { id: "quyuan-fenghe", title: "曲院风荷", tag: "自然风光", area: "杭州市西湖区" },
    { id: "sudi-chunxiao", title: "苏堤春晓", tag: "自然风光", area: "杭州市西湖区" },
    { id: "hubin-in77", title: "湖滨银泰 in77", tag: "商圈", area: "杭州市上城区" },
  ],
};

export const finalItineraryMocks = {
  "TT-HZ-1024": {
    code: "TT-HZ-1024",
    status: "已锁定行程",
    title: "国庆杭州旅行",
    destination: "杭州",
    dateRange: "10月1日 - 10月3日",
    duration: "3天2晚",
    memberCount: 8,
    dayCount: 3,
    placeCount: 8,
    transportCount: 7,
    summary: "漫游西湖，漫步北山街，品尝地道杭帮菜，打卡博物馆与展览，三天两晚感受杭州的自然之美与人文底蕴。",
    days: [
      {
        id: "day-1",
        label: "Day 1",
        date: "10月1日",
        weekday: "周三",
        stops: [
        {
          id: "west-lake",
          title: "西湖风景区",
            tags: ["自然风光", "5A景区"],
            address: "杭州市西湖区龙井路1号",
            note: "西湖十景闻名遐迩，湖光山色相映成趣，泛舟湖上，感受诗意杭州。",
            transfer: { type: "驾车", duration: "20 分钟", distance: "8 公里" },
          },
        {
          id: "beishan-street",
          title: "北山街",
            tags: ["街区漫步", "网红打卡"],
            address: "杭州市西湖区北山街",
            note: "被湖面起伏的历史文化街区，文艺小店、特色餐饮林立，适合慢悠悠逛逛。",
            transfer: { type: "步行", duration: "8 分钟", distance: "600 米" },
          },
        {
          id: "grandma-home",
          title: "外婆家（湖滨店）",
            tags: ["杭帮菜", "热门餐厅"],
            address: "杭州市上城区湖滨路3号（湖滨银泰in77 C区4楼）",
            note: "地道杭帮菜，人气杭帮餐厅，推荐茶香排骨、外婆红烧肉。",
            transfer: { type: "驾车", duration: "15 分钟", distance: "6 公里" },
          },
        {
          id: "zhejiang-museum",
          title: "浙江省博物馆（孤山馆区）",
            tags: ["博物馆", "文化艺术"],
            address: "杭州市西湖区孤山路25号",
            note: "馆藏丰富，展览精彩，感受浙江深厚的历史文化底蕴。",
          },
        ],
      },
      {
        id: "day-2",
        label: "Day 2",
        date: "10月2日",
        weekday: "周三",
        stops: [
        {
          id: "qingshan-lake",
          title: "青山湖国家森林公园",
            tags: ["自然风光", "轻徒步"],
            address: "杭州市临安区青山湖街道",
            note: "湖面开阔，水杉林静谧，适合安排半天轻松散步和拍照。",
            transfer: { type: "驾车", duration: "35 分钟", distance: "24 公里" },
          },
        {
          id: "linan-old-street",
          title: "临安老街",
            tags: ["历史街区", "小吃"],
            address: "杭州市临安区中山街",
            note: "逛老街、吃小吃，节奏轻松，适合午后慢慢走。",
          },
        ],
      },
      {
        id: "day-3",
        label: "Day 3",
        date: "10月3日",
        weekday: "周四",
        stops: [
        {
          id: "nanhu-scenic-area",
          title: "南湖景区",
            tags: ["自然风光", "轻松游"],
            address: "杭州市余杭区南湖街道",
            note: "湖光山色，适合返程前安排一段放松游览。",
            transfer: { type: "驾车", duration: "25 分钟", distance: "12 公里" },
          },
        {
          id: "return-trip",
          title: "返程",
            tags: ["交通"],
            address: "根据返程时间安排",
            note: "注意预留路上时间，建议提前确认车票或航班信息。",
          },
        ],
      },
    ],
  },
};

export const fetchFinalItineraryByCodeMock = (code) =>
  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const itinerary = finalItineraryMocks[code];

      if (itinerary) {
        resolve(structuredClone(itinerary));
        return;
      }

      reject(new Error("行程单不存在"));
    }, 120);
  });
