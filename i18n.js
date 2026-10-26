/* ════════════════════════════════════════════════════════
   i18n — tiny bilingual engine (English / 中文)

   How it works
   ------------
   markup  : <h2 data-i18n="about.heading">…</h2>
             <p data-i18n-html="about.bio1">…</p>        (strings with tags)
             <img data-i18n-attr="alt:about.photoAlt" /> (attributes)
   strings : the `dict` object below
   switch  : window.I18N.toggle() / setLang('zh' | 'en')

   The visitor's choice is stored in localStorage and the first
   visit is guessed from the browser's `navigator.languages`.
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEFAULT_LANG = 'en';
  const STORE_KEY    = 'lisaliu:lang';

  /* Label printed on the toggle: always the language you would
     switch TO, so the button reads as "中" while in English. */
  const LABELS = { en: 'A', zh: '中' };

  const dict = {
    /* ── English ───────────────────────────────────── */
    en: {
      'meta.title': 'Lisa Liu — CS student & product thinker',
      'meta.desc': 'Lisa Liu — computer science student at Harbin Institute of Technology, Shenzhen, and product manager intern building AI agent platforms.',

      'lang.switch': 'Switch to Chinese',

      'nav.about':    'About',
      'nav.skills':   'Skills',
      'nav.projects': 'Projects',
      'nav.contact':  'Contact',

      'hero.tagline': 'Building in global,<br/>Thinking in long term.',

      'about.label':   'About me',
      'about.heading': 'CS student,<br/>product thinker',
      'about.bio1':    "Hi! I'm Lisa — a computer science undergrad at <strong>Harbin Institute of Technology, Shenzhen</strong> (class of 2027), currently interning as a <strong>Product Manager</strong> at an AI startup where I'm shaping the future of AI agent platforms.",
      'about.bio2':    "My brain lives at the intersection of logic and creativity: I love math competition problems, building full-stack apps from scratch, and the quiet satisfaction of writing a good spec. On the side, I'm slowly making my way through JLPT prep and exploring how Japan approaches digital products.",
      'about.photoAlt': 'Lisa Liu',

      'skills.label':   'My Skills',
      'skills.heading': 'Things I work with',

      'projects.label':   'Projects',
      'projects.heading': 'Selected Projects',
      'projects.sub':     "A collection of things I've built.",

      'rag.title':          'End-to-End RAG System on the Wix Knowledge Base',
      'rag.lead':           'An end-to-end retrieval-augmented generation system for Wix customer support.',
      'rag.bgLabel':        'Background',
      'rag.bg':             'Built on 6,221 official Wix help articles and 400 real support tickets. The scenario splits into two hard question types — single-document exact match and multi-document multi-hop reasoning — so I designed an evaluation suite and drove every optimisation with offline experiments.',
      'rag.evalLabel':      'Evaluation design',
      'rag.eval':           'Analysing real tickets surfaced those two scenarios, so I re-cut the metrics per question type — Hit@5 and MRR for single-document questions, Full@5 for multi-document ones — and made joint improvement across every question set the bar for adopting a change.',
      'rag.modelLabel':     'Model selection',
      'rag.model':          'Benchmarked MiniLM, bge-small, E5-large and others. With comparable quality, MiniLM brought retrieval latency down to 1/4 and index build time to roughly 1/20 of the original plan — a large gain in responsiveness.',
      'rag.retrievalLabel': 'Retrieval optimisation',
      'rag.retrieval':      'For weak single-document accuracy I ran controlled experiments on chunking, retrieval strategy and reranking, and traced the biggest gain to contextual embedding. The final recipe — stop-word removal, document metadata on every chunk, and an 8:2 blend of semantic and keyword retrieval — lifted Top-5 recall on single-document QA pairs from 62% to 77%. For low full recall on multi-document questions, a small model rewrites the query and an agentic loop lets it retrieve autonomously, taking Full@5 from 35% to 75%.',
      'rag.tags':           'RAG · Retrieval · Evaluation · Embedding',
      'rag.view':           'View Project ↗',

      'landy.title':     'Landy — Job-Hunting Assistant Agent',
      'landy.lead':      'An AI job-hunting assistant agent for campus recruiting.',
      'landy.bgLabel':   'Background',
      'landy.bg':        'Company due diligence, résumé rewriting and interview prep are the most repetitive — and slowest — parts of campus recruiting. Landy is a job-hunting assistant agent built to take that weight off the candidate.',
      'landy.archLabel': 'Agent architecture',
      'landy.arch':      "A workflow split into four sub-agents — JD parsing, business research, résumé rewriting and mock interview. Research and rewriting run in parallel to cut end-to-end latency. The rewriting agent uses RAG over a ChromaDB vector index of the user's experience, pulling the passages that match JD keywords in real time; a HITL reflection loop then writes back into Memory, so user preferences persist and the agent grows more personalised over time.",
      'landy.evalLabel': 'Prompting & evaluation',
      'landy.eval':      'Built an evaluation system scored on JD match and user satisfaction, assembled a high-quality dataset, and layered LLM-as-judge on top of human annotation to drive prompt optimisation. After iteration, the JD match rate of AI-rewritten résumés rose by about 35%.',
      'landy.tags':      'Agent · RAG · Workflow · Evaluation',

      'contact.heading': 'Let\'s <em>connect</em>',
      'contact.sub':     "Always happy to chat about AI products, or whatever you're building. Drop me a message.",
      'contact.email':   'Email',

      'footer.text': 'Crafted with ♡ and a lot of tea by <a href="#hero">Lisa Liu</a>'
    },

    /* ── 中文 ──────────────────────────────────────── */
    zh: {
      'meta.title': 'Lisa Liu',
      'meta.desc': 'Lisa Liu —— 哈尔滨工业大学（深圳）计算机科学专业本科生，AI 初创公司产品经理实习生，正在构建 AI Agent 平台。',

      'lang.switch': '切换到英文',

      'nav.about':    '关于',
      'nav.skills':   '技能',
      'nav.projects': '项目',
      'nav.contact':  '联系',

      'hero.tagline': '立足全球，<br/>着眼长期。',

      'about.label':   '我是一个什么样的人',
      'about.heading': '',
      'about.bio1':    '你好，我是莉姗，你也可以叫我Lisa —— <strong>哈尔滨工业大学（深圳）</strong>计算机科学专业 2027 届本科生，担任<strong>产品经理</strong>，正在想象 AI 的未来',
      'about.bio2':    '我的思维游走在逻辑与创造力之间：喜欢数学竞赛、喜欢从零搭起一个全栈应用，也享受写好一份需求文档时那种安静的满足感。课余我慢慢啃着 JLPT，也在观察日本是怎么做数字产品的。',
      'about.photoAlt': 'Lisa Liu 的照片',

      'skills.label':   '手艺与工具箱',
      'skills.heading': '我的技能',

      'projects.label':   '项目',
      'projects.heading': '精选项目',
      'projects.sub':     '我做过的那些东西。',

      'rag.title':          '基于 Wix 知识库的端到端 RAG 系统',
      'rag.lead':           '面向 Wix 客服场景的端到端检索增强生成系统。',
      'rag.bgLabel':        '背景',
      'rag.bg':             '面向建站平台 Wix 的客服场景，基于官方发布的 6,221 篇帮助文档与 400 道真实工单搭建 RAG 系统。针对该场景中「单文档精确匹配」与「多文档多跳推理」两类典型问题，设计评测体系并以离线实验驱动优化策略。',
      'rag.evalLabel':      '评估体系设计',
      'rag.eval':           '分析真实工单，识别出「单文档精确匹配」与「多文档多跳推理」两类场景，据此重新设计不同题型的评测指标——单篇看 Hit@5 / MRR，多文档看 Full@5，并把多题集指标共同提升作为最终采纳门槛。',
      'rag.modelLabel':     '模型选型',
      'rag.model':          '对比测试 MiniLM、bge-small、E5-large 等多种 Embedding 模型，在效果相当的前提下选择 MiniLM，使检索延迟降为原方案的 1/4、索引构建时间约为 1/20，大幅提升了响应速度。',
      'rag.retrievalLabel': '检索策略优化',
      'rag.retrieval':      '针对单文档回答精确度不高的问题，围绕 Chunking、检索策略、Rerank 方法进行对照实验，定位最大收益来自 Contextual Embedding，最终确定去停用词、为文档分块添加文档元数据，并以 8:2 融合语义检索与关键词的检索方案，使单文档 QA 对的 Top-5 召回率从 62% 提升至 77%；针对多文档问答中完整召回率较低的问题，使用小模型改写 query，并以 agentic 方式允许 agent 自主检索，使 Full@5 从 35% 提升至 75%。',
      'rag.tags':           'RAG · 检索 · 评测 · Embedding',
      'rag.view':           '查看项目 ↗',

      'landy.title':     'Landy — 求职助手 Agent',
      'landy.lead':      '面向校招求职的 AI 求职助手 Agent。',
      'landy.bgLabel':   '背景',
      'landy.bg':        '针对校招生求职过程中公司尽调、简历改写、备试环节高度重复且效率低下的核心痛点，Landy 是一个提高求职效率的求职助手 Agent。',
      'landy.archLabel': 'Agent 架构设计',
      'landy.arch':      '设计 workflow，把工作流拆解为 JD 解析、业务调研、简历改写、模拟面试四个 sub-Agent；调研与简历改写子任务并行执行，以降低端到端延迟。简历改写 Agent 中使用 RAG——基于 ChromaDB 对用户经历做向量索引，按 JD 关键词实时检索相关段落来改写简历；同时引入 HITL，通过反思循环写入 Memory，持久化用户偏好，提升 Agent 的个性化水平。',
      'landy.evalLabel': 'PE、评测与优化',
      'landy.eval':      '制定以 JD 匹配度、用户满意度评分为维度的评价框架，搭建评测系统并构建高质量数据集；在人工标注的基础上引入 LLM-as-judge，据此持续优化 prompt。迭代后，AI 改写简历与 JD 的匹配率提升约 35%。',
      'landy.tags':      'Agent · RAG · 工作流 · 评测',

      'contact.heading': '让我们<em>保持联系</em>',
      'contact.sub':     '很乐意聊聊 AI 产品，或者你正在做的任何事。给我留条消息吧。',
      'contact.email':   '邮件',

      'footer.text': '由 <a href="#hero">Lisa Liu</a> 用 ♡ 和很多茶制作'
    }
  };

  let lang = DEFAULT_LANG;
  const listeners = [];

  /* ── Lookup with English as fallback ──────────────── */
  function t(key) {
    const table = dict[lang] || dict[DEFAULT_LANG];
    if (key in table) return table[key];
    if (key in dict[DEFAULT_LANG]) return dict[DEFAULT_LANG][key];
    return '';
  }

  /* ── Paint the page in the current language ───────── */
  function apply() {
    const root = document.documentElement;
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    root.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const value = t(el.dataset.i18n);
      if (value) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const value = t(el.dataset.i18nHtml);
      if (value) el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(',').forEach(function (pair) {
        const bits = pair.split(':');
        const attr = (bits[0] || '').trim();
        const key  = (bits[1] || '').trim();
        if (!attr || !key) return;
        const value = t(key);
        if (value) el.setAttribute(attr, value);
      });
    });

    document.title = t('meta.title');

    /* The toggle shows where you would go next */
    const next   = lang === 'en' ? 'zh' : 'en';
    const toggle = document.getElementById('lang-toggle');
    if (toggle) {
      const label = toggle.querySelector('.lang-toggle-label');
      if (label) label.textContent = LABELS[next];
      toggle.setAttribute('aria-label', t('lang.switch'));
      toggle.setAttribute('title', t('lang.switch'));
      toggle.setAttribute('aria-pressed', String(lang === 'zh'));
    }

    listeners.forEach(function (fn) { fn(lang); });
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang, t: t } }));
  }

  function setLang(next, persist) {
    if (!(next in dict)) return;
    lang = next;
    if (persist !== false) {
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* private mode */ }
    }
    apply();
  }

  /* stored choice → browser language → default */
  function initialLang() {
    let saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    if (saved && saved in dict) return saved;

    const preferred = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^zh\b/i.test(preferred) ? 'zh' : DEFAULT_LANG;
  }

  window.I18N = {
    t: t,
    setLang: setLang,
    toggle: function () { setLang(lang === 'en' ? 'zh' : 'en'); },
    onChange: function (fn) { listeners.push(fn); },
    get lang() { return lang; }
  };

  const toggleBtn = document.getElementById('lang-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () { window.I18N.toggle(); });
  }

  setLang(initialLang(), false);
})();
