
<!-- Gitalk 评论 start  -->
{% if site.gitalk.enable %}
<!-- Link Gitalk 的支持文件  -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gitalk@1/dist/gitalk.css">
<script src="https://cdn.jsdelivr.net/npm/gitalk@1/dist/gitalk.min.js"></script>

<div id="gitalk-container"></div>
<script type="text/javascript">
var gitalk = new Gitalk({
  clientID: '4dede977f9d18025b3b5',
  clientSecret: 'e581aa2d1471ebbb0785b39b54d748cff07a1301',
  repo: 'xie96808.github.io',
  owner: 'xie96808',
  admin: ['xie96808'],
  id: https://xieyw.xyz/2022/06/07/%E6%A0%91%E9%80%BB%E8%BE%91%E4%B8%93%E9%A2%98/,      // Ensure uniqueness and length less than 50
  distractionFreeMode: false  // Facebook-like distraction free mode
})

gitalk.render('gitalk-container')
</script>
{% endif %}
<!-- Gitalk end -->
