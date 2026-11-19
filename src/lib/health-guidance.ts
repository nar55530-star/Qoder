const medicationSource = "https://kepu.wjw.gz.gov.cn/home/jktt/content/post_7306.html";
const measurementSource = "https://www.nhc.gov.cn/ylyjs/zcwj/202412/ba037e931fff4870930f65ff667ea9ed/files/1736390751587_80714.pdf";

export const healthTopics = {
  label: {
    text: "看药盒时，先找通用名称、药品规格、有效期和保存条件。‘缓释’指药物按设计逐渐释放。如果想知道自己该怎样服用，带上包装和处方，向医生或药师核对。",
    source: "https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2023/art_b1a64fa4b9314ecabadf3c6662b70c48.html",
  },
  missed: {
    text: "漏服后先记下药名、原定时间和发现的时间，尽快向开药医生或药师确认怎么处理。先不要自行加倍补服。",
    source: medicationSource,
  },
  list: {
    text: "把正在用的药品、保健品、实际服用时间和已知药物过敏写在一张清单上。复诊前核对清单，有疑问就带上原包装请医生或药师一起看。",
    source: medicationSource,
  },
  visit: {
    text: "复诊可带上用药清单、近期测量记录和已有检查结果。先写下最想问的事，例如下次何时复查、在家怎样记录和出现哪些情况需要联系医院。",
    source: measurementSource,
  },
  measure: {
    text: "按测量仪上的单位记下读数和时间。记录血压时分开写高压和低压，记录血糖时标记空腹还是餐后。复诊时可以把这些记录带给医生。",
    source: measurementSource,
  },
} as const;

type LocalAnswer = { text: string; onlyLocal: boolean; emergency?: boolean; source?: string };
const urgentSymptoms = /胸痛|胸闷|胸口.{0,5}(痛|疼|压|紧)|呼吸困难|喘不上气|喘不过气|意识不清|昏迷|晕厥|抽搐|口角歪|嘴.{0,2}歪|脸.{0,3}歪|一侧.{0,5}无力|说话.{0,3}(不清|含糊)|大量出血/;
const accidentalDose = /误服|吃错药|药.{0,5}(吃多了|过量)|过量.{0,5}(吃|服|用药)|不小心.{0,8}(多吃|双倍|两倍|加倍)|重复服药/;

export function containsHealthIdentifiers(text: string) {
  const compact = text.normalize("NFKC").replace(/[\s-]/g, "");
  return /(?:^|\D)(?:1[3-9]\d{9}|\d{17}[\dXx])(?:\D|$)/.test(compact)
    || /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(compact)
    || /(?:我叫|姓名[:：]|住址[:：]|病历号|身份证号)/.test(compact);
}

export function getLocalHealthAnswer(question: string): LocalAnswer {
  const text = question.normalize("NFKC");
  if (urgentSymptoms.test(text) || accidentalDose.test(text)) {
    return {
      text: "如果现在出现突发胸痛、呼吸困难、意识不清等急症，或怀疑用药过量，请立即求助。在中国大陆可拨打 120，按调度员的指引处理。",
      onlyLocal: true,
      emergency: true,
      source: "https://www.beijing.gov.cn/fuwu/bmfw/sy/jrts/202607/t20260713_4759730.html",
    };
  }
  if (/漏服|忘了?吃药|忘.{0,2}服药|补服|忘记用药/.test(text)) return { ...healthTopics.missed, onlyLocal: true };
  if (/换药|停药|停用|加量|减量|多吃|少吃|一起吃|一起用|同服|混着吃|几片|几粒|几次|多少毫克|能.{0,2}掰|掰开|能.{0,2}吃|要.{0,2}吃|吃什么药|吃哪种|用什么药|血压.{0,6}\d|血糖.{0,6}\d|正常吗|严重吗|是不是得了|诊断|开药|副作用|不良反应/.test(text)) {
    return { text: "请把药盒、处方和相关记录带给医生或药师核对。具体用药、剂量和检查结果需要结合个人情况判断。", onlyLocal: true };
  }
  if (/药盒|说明书|缓释|有效期|规格|通用名/.test(text)) return { ...healthTopics.label, onlyLocal: false };
  if (/用药清单|药物清单|记录用药|记住用药/.test(text)) return { ...healthTopics.list, onlyLocal: false };
  if (/医院|复诊|就诊|看医生|问医生|带什么/.test(text)) return { ...healthTopics.visit, onlyLocal: false };
  if (/记录|读数|高压|低压|血压|血糖|mmHg|mmol/i.test(text)) return { ...healthTopics.measure, onlyLocal: false };
  return { text: "可以问我怎样看药盒、怎样整理用药清单，或复诊该带什么。具体吃什么药、怎么吃，请向医生或药师核对。", onlyLocal: false };
}
