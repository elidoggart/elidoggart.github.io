export const DIFFICULTIES=Object.freeze({
 easy:Object.freeze({id:'easy',aliensPerPlanet:1,label:'Easy',landingSpeed:105,landingBrake:3.8,scoreMultiplier:1,shotSpeed:.8,fireInterval:1.4,damageProtection:3.6,launchProtection:3.8,description:'One alien per planet, gentler landings, and slower shots.'}),
 medium:Object.freeze({id:'medium',aliensPerPlanet:2,label:'Medium',landingSpeed:65,landingBrake:2.3,scoreMultiplier:1.5,shotSpeed:1,fireInterval:1,damageProtection:2.7,launchProtection:2.8,description:'Two aliens per planet with balanced patrols.'}),
 hard:Object.freeze({id:'hard',aliensPerPlanet:3,label:'Hard',landingSpeed:65,landingBrake:2.3,scoreMultiplier:2.5,shotSpeed:1.85,fireInterval:.4,enemySpeed:1.5,enemySteering:1.4,volley:3,predictiveAim:true,damageProtection:1.8,launchProtection:1.8,description:'Three aggressive aliens per planet with faster pursuit, predictive aim, and rapid three-shot volleys.'})
});
export const getDifficulty=id=>Object.hasOwn(DIFFICULTIES,id)?DIFFICULTIES[id]:DIFFICULTIES.medium;
