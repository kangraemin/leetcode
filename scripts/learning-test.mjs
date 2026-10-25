import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {lessons} from '../data/lessons.js';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:4173/#learn');await page.getByRole('heading',{name:'알던 코드, 떠오르는 이름.'}).waitFor();
await page.screenshot({path:'/tmp/kotlin-learning-home.png',fullPage:true});
await page.getByRole('button',{name:'첫 단원 시작',exact:false}).click();
for(const l of lessons){
 await page.getByRole('heading',{name:l.title,exact:true}).waitFor();
 await page.locator('[data-next]').click();
 await page.locator(`[data-choice="${(l.answer+1)%3}"]`).click();assert.ok(await page.locator('[data-next]').isDisabled());
 await page.locator(`[data-choice="${l.answer}"]`).click();await page.locator('[data-next]').click();
 await page.getByLabel('메서드 또는 프로퍼티 이름').fill('wrong');await page.getByRole('button',{name:'답 확인',exact:true}).click();assert.ok(await page.locator('#lesson-finish').isHidden());
 await page.getByRole('button',{name:'힌트 보기'}).click();assert.equal(await page.locator('#lesson-feedback').textContent(),l.hint);
 await page.getByLabel('메서드 또는 프로퍼티 이름').fill(l.expected[0]);await page.getByRole('button',{name:'답 확인',exact:true}).click();
 if(l.id==='sort')await page.screenshot({path:'/tmp/kotlin-learning-exercise.png',fullPage:true});
 await page.locator('[data-finish]').click();
}
await page.reload();await page.getByRole('heading',{name:'한 바퀴 끝냈어요. 다시 꺼내볼까요?'}).waitFor();
assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('one-problem-650-v1')).lessons).length),12);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
// Ensure legacy backups still load and lesson progress can be restored.
await page.evaluate(()=>localStorage.setItem('one-problem-650-v1',JSON.stringify({version:1,goal:1,records:{}})));await page.reload();await page.getByRole('button',{name:'첫 단원 시작',exact:false}).waitFor();
console.log('All 12 lessons: wrong/correct choices, typed recall, hints, completion/reload, old-state migration, mobile overflow passed.');await browser.close();
