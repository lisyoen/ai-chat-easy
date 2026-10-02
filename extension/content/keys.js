// 키 판정 로직 (순수 함수). 브라우저와 node 테스트 양쪽에서 로드된다.
(function (root) {
  "use strict";

  /**
   * @param {{key:string, keyCode?:number, isComposing?:boolean, shiftKey?:boolean,
   *          ctrlKey?:boolean, metaKey?:boolean, altKey?:boolean}} ev
   * @param {boolean} inComposer 이벤트 대상이 채팅 입력창 안인지
   * @returns {"newline"|"send"|"pass"}
   */
  function decideAction(ev, inComposer) {
    if (!inComposer) return "pass";
    if (ev.key !== "Enter") return "pass";
    // 한글 등 IME 조합 중 Enter 는 조합 확정용이므로 건드리지 않는다.
    if (ev.isComposing || ev.keyCode === 229) return "pass";
    if (ev.altKey || ev.shiftKey) return "pass";
    if (ev.ctrlKey || ev.metaKey) return "send";
    return "newline";
  }

  const api = { decideAction };
  root.AICE = Object.assign(root.AICE || {}, api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
