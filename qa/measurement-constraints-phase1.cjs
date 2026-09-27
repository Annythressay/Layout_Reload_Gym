// Migrated actual/simulation contract. Original assertions and replacement rationale:
// body-visualizer-actual-vs-simulation-precommit/legacy-originals/qa__measurement-constraints-phase1.cjs
// body-visualizer-actual-vs-simulation-precommit/legacy-test-inventory.md
require('./body-visualizer-actual-vs-simulation-precommit/contract.cjs')().then(report=>{if(!report.pass)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
