export default {
  pages: [
    "pages/home/index",
    "pages/record/index",
    "pages/profile/index",
    "pages/login/index",
    "pages/profile-edit/index",
    "pages/mbti-setting/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#66bb6a",
    navigationBarTitleText: "",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    custom: true,
    color: "#9e9e9e",
    selectedColor: "#66bb6a",
    backgroundColor: "#f8fff9",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/home/index",
        text: "首页"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的"
      }
    ]
  },
  style: "v2",
};