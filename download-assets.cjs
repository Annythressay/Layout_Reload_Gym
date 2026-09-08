const fs=require('fs');
const path=require('path');
// Temporary Unsplash photography. See ASSETS.md before production launch.
const photos={
'hero/reload-hero':'1534438327276-14e5300c3a48',
'branches/reload-women':'1518611012118-696072aa579a',
'branches/reload-main':'1581009146145-b5ef050c2e1e',
'facilities/strength-zone':'1534438327276-14e5300c3a48',
'facilities/cardio-zone':'1571902943202-507ec2618e8f',
'facilities/free-weight':'1586401100295-7a8096fd231a',
'facilities/functional-area':'1534438327276-14e5300c3a48',
'facilities/boxing-area':'1549719386-74dfcbf7dbed',
'facilities/group-class-studio':'1518611012118-696072aa579a',
'facilities/locker-wellness':'1540555700478-4be289fbecef',
'services/gym':'1581009146145-b5ef050c2e1e',
'services/personal-training':'1571019613454-1cb2f99b2d8b',
'services/group-class':'1518611012118-696072aa579a',
'services/boxing':'1549719386-74dfcbf7dbed',
'services/wellness':'1540555700478-4be289fbecef',
'trainers/personal-training':'1571019613454-1cb2f99b2d8b',
'wellness/recovery':'1544161515-4ab6ce6db874',
'members/linh-nguyen':'1517841905240-472988babdf9',
'members/minh-tran':'1506794778202-cad84cf45f1d',
'members/ha-vy':'1534528741775-53994a69daeb',
'members/duc-pham':'1500648767791-00dcc994a43e',
'social/video-1':'1581009146145-b5ef050c2e1e',
'social/video-2':'1518611012118-696072aa579a',
'social/video-3':'1571019613454-1cb2f99b2d8b',
'social/video-4':'1549719386-74dfcbf7dbed',
'social/video-5':'1571902943202-507ec2618e8f',
'social/video-6':'1534438327276-14e5300c3a48',
'locations/reload-women':'1571902943202-507ec2618e8f',
'locations/reload-main':'1534438327276-14e5300c3a48'
};
(async()=>{const cache=new Map();for(const id of new Set(Object.values(photos))){const response=await fetch(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`);if(!response.ok)throw Error(`${id}: ${response.status}`);cache.set(id,Buffer.from(await response.arrayBuffer()));console.log('Downloaded',id);}for(const [name,id]of Object.entries(photos)){fs.writeFileSync(path.join(__dirname,'assets/images',name+'.jpg'),cache.get(id));}fs.writeFileSync(path.join(__dirname,'ASSETS.md'),'# Production image checklist\n\nThe official logo is supplied and copied unchanged. All other photography is temporary Unsplash imagery; portraits, names, reviews, social view counts and class times are illustrative, not verified RELOAD claims. Replace these before publishing. Location photos currently show interiors rather than actual branch exteriors.\n\n| Local asset | Production photo needed | Temporary source |\n|---|---|---|\n'+Object.entries(photos).map(([n,id])=>`| assets/images/${n}.jpg | ${n.replaceAll('/',' — ').replaceAll('-',' ')} | https://images.unsplash.com/photo-${id} |`).join('\n')+'\n\nAlso supply the hero film, six social videos, verified location addresses and hotlines, social URLs, approved testimonials, membership terms, privacy policy, and booking/newsletter integrations. Placeholder addresses are intentionally not mapped to real businesses.\n');})();
