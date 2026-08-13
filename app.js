const editor=document.querySelector('#editor'),preview=document.querySelector('#preview'),filename=document.querySelector('#filename'),panes=document.querySelector('#panes'),toast=document.querySelector('#toast'),saveStatus=document.querySelector('#saveStatus');
const starter=`# A Clear, Useful Title

Write a short introduction that tells readers what they will learn and why it matters.

## The main idea

Explain one idea at a time. Keep paragraphs focused and use **bold text** only when it helps someone scan the page.

> A useful note, principle, or quotation can go here.

### A practical example

\`\`\`js
const message = "Markdown stays readable everywhere";
console.log(message);
\`\`\`

## Key takeaways

- Keep the structure simple
- Prefer descriptive headings
- Check every link before publishing

## Next steps

- [ ] Review the article
- [ ] Save the Markdown file
- [ ] Commit and push it to GitHub
`;
if(window.marked)marked.setOptions({gfm:true,breaks:true});editor.value=localStorage.getItem('inkdown-content')||starter;filename.value=localStorage.getItem('inkdown-filename')||'my-new-article';
const safeName=v=>v.toLowerCase().trim().replace(/\.md$/i,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'untitled';
function update(){const text=editor.value;preview.innerHTML=window.marked?marked.parse(text):`<pre>${text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre>`;const words=text.trim()?text.trim().split(/\s+/).length:0,lines=text.split('\n').length;document.querySelector('#wordCount').textContent=`${words} word${words===1?'':'s'}`;document.querySelector('#readTime').textContent=`${Math.max(1,Math.ceil(words/220))} min read`;document.querySelector('#lineCount').textContent=`${lines} line${lines===1?'':'s'}`;localStorage.setItem('inkdown-content',text);localStorage.setItem('inkdown-filename',filename.value);saveStatus.textContent='Draft saved locally'}
function notify(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}function wrap(a,b=a,f=''){const s=editor.selectionStart,e=editor.selectionEnd,x=editor.value.slice(s,e)||f;editor.setRangeText(a+x+b,s,e,'end');editor.focus();update()}function prefix(p){const s=editor.selectionStart,e=editor.selectionEnd,l=editor.value.lastIndexOf('\n',s-1)+1,x=editor.value.slice(l,e||s);editor.setRangeText(x.split('\n').map((v,i)=>typeof p==='function'?p(v,i):p+v).join('\n'),l,e||s,'end');editor.focus();update()}
const formats={heading:()=>prefix('## '),bold:()=>wrap('**','**','important text'),italic:()=>wrap('_','_','emphasis'),link:()=>wrap('[','](https://example.com)','link text'),quote:()=>prefix('> '),code:()=>wrap('`','`','code'),bullet:()=>prefix('- '),number:()=>prefix((v,i)=>`${i+1}. ${v}`),check:()=>prefix('- [ ] ')};document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>formats[b.dataset.format]());document.querySelectorAll('.mode-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');panes.className=`panes ${b.dataset.mode}`});
async function saveFile(){const name=`${safeName(filename.value)}.md`;filename.value=safeName(filename.value);const blob=new Blob([editor.value],{type:'text/markdown;charset=utf-8'});if('showSaveFilePicker'in window)try{const h=await showSaveFilePicker({suggestedName:name,types:[{description:'Markdown file',accept:{'text/markdown':['.md']}}]}),w=await h.createWritable();await w.write(blob);await w.close();saveStatus.textContent=`Saved as ${h.name}`;notify('Markdown saved to your folder');return}catch(e){if(e.name==='AbortError')return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);saveStatus.textContent=`Downloaded ${name}`;notify('Markdown file downloaded')}
document.querySelector('#saveButton').onclick=saveFile;document.querySelector('#openButton').onclick=()=>document.querySelector('#fileInput').click();document.querySelector('#fileInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;editor.value=await f.text();filename.value=f.name.replace(/\.(md|markdown)$/i,'');update();notify(`Opened ${f.name}`);e.target.value=''};document.querySelector('#newButton').onclick=()=>{if(editor.value!==starter&&!confirm('Start a new file? Your current draft will be replaced.'))return;editor.value='# Untitled article\n\nStart writing here…\n';filename.value='untitled-article';update();editor.focus()};editor.oninput=update;filename.oninput=update;filename.onblur=()=>{filename.value=safeName(filename.value);update()};document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveFile()}});
const dialog=document.querySelector('#frontmatterDialog');document.querySelector('#frontmatterButton').onclick=()=>dialog.showModal();document.querySelector('#insertFrontmatter').onclick=e=>{e.preventDefault();const clean=v=>v.replace(/"/g,'\\"').trim(),title=clean(document.querySelector('#metaTitle').value),desc=clean(document.querySelector('#metaDescription').value),author=clean(document.querySelector('#metaAuthor').value),tags=document.querySelector('#metaTags').value.split(',').map(x=>x.trim()).filter(Boolean),fields=['---',title&&`title: "${title}"`,desc&&`description: "${desc}"`,author&&`author: "${author}"`,document.querySelector('#metaDate').checked&&`date: ${new Date().toISOString().slice(0,10)}`,tags.length&&`tags: [${tags.map(x=>`"${clean(x)}"`).join(', ')}]`,'---',''].filter(Boolean);editor.value=fields.join('\n')+'\n'+editor.value.replace(/^---[\s\S]*?---\s*/,'');update();dialog.close();notify('Front matter added')};update();
