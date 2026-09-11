// Port of NpkMix2 NPKSolver.kt. Preserve the original calculation behavior.
const errorRes=(description,smartNote)=>({totalWeight:0,filler:0,components:[],actualNPK:[0,0,0],description,smartNote,isFormulaValid:false});
function internal(tN,tP,tK,tW,selected,distribute){
 const needed=[tW*tN/100,tW*tP/100,tW*tK/100],cur=[0,0,0],weights=new Map();
 const add=(f,w)=>{weights.set(f.name,(weights.get(f.name)||0)+w);cur[0]+=w*f.n/100;cur[1]+=w*f.p/100;cur[2]+=w*f.k/100;};
 const max=(list,key)=>list.reduce((a,b)=>b[key]>a[key]?b:a);
 const ps=selected.filter(f=>f.p>0);
 if(needed[1]>0){if(!ps.length)return errorRes('','');if(distribute)ps.forEach(f=>add(f,(needed[1]/ps.length)/(f.p/100)));else{const f=max(ps,'p');add(f,needed[1]/(f.p/100));}}
 const kr=needed[2]-cur[2],ks=selected.filter(f=>f.k>0);
 if(kr>0){if(!ks.length)return errorRes('','');if(distribute)ks.forEach(f=>add(f,(kr/ks.length)/(f.k/100)));else{const f=max(ks,'k');add(f,kr/(f.k/100));}}
 const nr=needed[0]-cur[0],ns=selected.filter(f=>f.n>0&&(!distribute||(f.p===0&&f.k===0)));
 if(nr>0.01){if(!ns.length){const fallback=selected.filter(f=>f.n>0);if(!fallback.length)return errorRes('','');fallback.forEach(f=>add(f,(nr/fallback.length)/(f.n/100)));}else if(distribute)ns.forEach(f=>add(f,(nr/ns.length)/(f.n/100)));else{const f=max(ns,'n');add(f,nr/(f.n/100));}}
 return {totalWeight:[...weights.values()].reduce((a,b)=>a+b,0),filler:0,components:[...weights].filter(([,w])=>w>0),actualNPK:cur.map(v=>v/tW*100),isFormulaValid:true,isOverflow:false,isDistorted:false};
}
function solve(i,s,distribute,description){const r=internal(i.targetN,i.targetP,i.targetK,i.targetWeight,s,distribute),w=r.components.reduce((a,c)=>a+c[1],0);return {...r,description,totalWeight:w>i.targetWeight?w:i.targetWeight,filler:w<i.targetWeight?i.targetWeight-w:0,smartNote:distribute&&Math.abs(r.actualNPK[0]-i.targetN)>0.05?'Ghi chú: Tỷ lệ Đạm (N) bị lệch do sử dụng nhiều loại phân chứa P có kèm N (như DAP). Hãy giảm bớt loại phân tích chọn.':w>i.targetWeight?'Ghi chú: Vượt khối lượng mục tiêu.':'Ghi chú: Công thức phù hợp. Thêm chất độn.'};}
function search(i,s){let best=null,min=Number.MAX_VALUE;const range=[-.5,-.4,-.3,-.2,-.1,0,.1,.2,.3,.4,.5],clamp=v=>Math.min(100,Math.max(0,v));outer:for(const dn of range)for(const dp of range)for(const dk of range){const r=internal(clamp(i.targetN+dn),clamp(i.targetP+dp),clamp(i.targetK+dk),i.targetWeight,s,false);if(r.isFormulaValid){const diff=Math.abs(r.components.reduce((a,c)=>a+c[1],0)-i.targetWeight);if(diff<min){min=diff;best=r;}if(diff<.01)break outer;}}
 return best?{...best,description:'PHƯƠNG ÁN 2: CHUẨN KHỐI LƯỢNG (RÀ NGHIỆM)',totalWeight:i.targetWeight,filler:0,smartNote:`Ghi chú: Đã rà nghiệm trong mức lệch 0.5% để khớp đúng ${i.targetWeight} kg không chất độn.`}:errorRes('PHƯƠNG ÁN 2: CHUẨN KHỐI LƯỢNG','Không tìm thấy nghiệm phù hợp trong khoảng lệch 0.5%.');}
export function calculate(i){try{if(i.targetWeight<=0)return [errorRes('LỖI','Vui lòng nhập khối lượng mục tiêu lớn hơn 0.')];const s=i.selectedFertilizers.filter(f=>f.isSelected);if(!s.length)return [errorRes('LỖI','Vui lòng chọn ít nhất một loại phân bón.')];return [solve(i,s,false,'PHƯƠNG ÁN 1: CHUẨN TỶ LỆ NPK'),search(i,s),solve(i,s,true,'PHƯƠNG ÁN 3: PHỐI TRỘN TẤT CẢ')];}catch(e){return [errorRes('LỖI','Lỗi: '+e.message)];}}
