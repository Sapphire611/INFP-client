export default {
  pages: [
    "pages/home/index",
    "pages/tasks/index",
    "pages/courses/index",
    "pages/courses/detail/index",
    "pages/stars/index",
    "pages/profile/index",
    "pages/index/index",
    "pages/login/index",
    "pages/profile-edit/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    custom: true,
    color: "#999",
    selectedColor: "#1890ff",
    backgroundColor: "#fff",
    list: [
      {
        pagePath: "pages/home/index",
        text: "首页"
      },
      {
        pagePath: "pages/tasks/index",
        text: "任务"
      },
      {
        pagePath: "pages/courses/index",
        text: "课程"
      },
      {
        pagePath: "pages/stars/index",
        text: "星星"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的"
      }
    ]
  },
  style: "v2",
};
