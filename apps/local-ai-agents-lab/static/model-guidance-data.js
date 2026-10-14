'use strict';
window.ModelGuidanceData=Object.freeze({
  roles:Object.freeze({
    Trainer:Object.freeze({size:'8B–14B',capabilities:['Structured teaching','Logical reasoning','Clear explanations','Exercise generation','Adaptation to different difficulty levels'],explanation:'The Trainer requires strong instruction-following and reasoning capabilities to generate useful lessons and appropriately challenging exercises.'}),
    Student:Object.freeze({size:'3B–8B',capabilities:['Instruction following','Problem-solving','Reasoning','Applying feedback within the available context','Task completion'],explanation:'A smaller Student model can provide a useful baseline for evaluating performance and improvement across repeated experiments. A larger Student model may also be appropriate depending on the experiment.'}),
    Evaluator:Object.freeze({size:'7B–14B',capabilities:['Critical reasoning','Error identification','Rubric-based evaluation','Consistent scoring','Evidence-based assessment'],explanation:'Evaluation quality depends on reasoning, calibration, consistency and the suitability of the model for assessment tasks. Specialized evaluation capabilities may matter more than parameter count alone.'}),
    Improver:Object.freeze({size:'14B–32B',capabilities:['Advanced reasoning','Error analysis','Corrective explanations','Solution refinement','Designing follow-up exercises'],explanation:'The Improver benefits from strong analytical capabilities when identifying weaknesses, correcting reasoning and designing improved solutions.'}),
    Planner:Object.freeze({size:'7B?14B',capabilities:['Task decomposition','Prioritization','Planning coherent steps','Identifying constraints','Clear instructions'],explanation:'Choose a model that can break the task into coherent steps and communicate the plan clearly.'}),
    Researcher:Object.freeze({size:'7B?14B',capabilities:['Investigating available context','Comparing explanations','Evidence-aware synthesis','Recognizing uncertainty','Careful reasoning'],explanation:'Choose a model that can examine the supplied context and distinguish supported statements from assumptions. No automatic web access is provided.'}),
    Reviewer:Object.freeze({size:'7B?14B',capabilities:['Critical review','Detecting errors','Checking requirements','Identifying unsupported claims','Actionable feedback'],explanation:'Choose a model that can critically assess the Planner and Researcher outputs and identify gaps, errors, and ways to improve.'})
  }),
  profiles:Object.freeze([
    Object.freeze({name:'Lite',description:'Prioritizes smaller models, lower resource requirements and faster experimentation.'}),
    Object.freeze({name:'Balanced',description:'Prioritizes a practical balance between reasoning capabilities, execution speed and hardware requirements.'}),
    Object.freeze({name:'Advanced',description:'Prioritizes stronger or specialized models when sufficient computational resources are available.'})
  ]),
  hardware:'Consider available system RAM, GPU VRAM when present, CPU processing capability, model quantization, context length, and the specific model configuration. Actual compatibility depends on the model and configuration; no hardware detection or compatibility assessment is performed.'
});
