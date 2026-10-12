# Markellos Ecosystem AI Agents Lab — Private Local Starter (v0.1.2)

Αρχική εφαρμογή για το **Windows laptop**, με δύο χώρους εργασίας:

- **Learning Lab:** ένας trainer και ένας student agent.
- **AI Conference Room:** Architect, Developer, Reviewer συζητούν διαδοχικά στο ίδιο ιστορικό.

Και οι δύο χώροι χρησιμοποιούν το επιλεγμένο **τοπικό** μοντέλο Ollama με διαφορετικές οδηγίες ρόλων. Δεν αποτελούν ανεξάρτητα εκπαιδευμένα μοντέλα. Δεν εκτελούν εντολές, δεν έχουν πρόσβαση σε GitHub, repositories ή αρχεία. Η ανατροφοδότηση δεν είναι αντικειμενική απόδειξη βελτίωσης.

Το **Learning Lab** είναι η εκπαιδευτική αίθουσα (εσωτερικό API id: `university` για συμβατότητα με την αρχική έκδοση). Το **AI Conference Room** διατηρείται αμετάβλητο στη λειτουργία του.

**Σημείωση:** Πρόκειται για πειραματικό τοπικό εργαστήριο, όχι αναγνωρισμένο εκπαιδευτικό ίδρυμα.

## Προαπαιτούμενα

1. **Python 3.9+** σε Windows, εγκατεστημένο από python.org, με ενεργή την επιλογή PATH.
2. **Ollama για Windows** από <https://ollama.com/download/windows>.
3. Ένα **local** model, ενδεικτικά με PowerShell: `ollama pull qwen3:4b`. Είναι περίπου 2.5 GB σε δίσκο· η καταλληλότητά του εξαρτάται από RAM/CPU/GPU.

## Inference engines / Inference engines

Η εφαρμογή προσφέρει μόνο τρεις σταθερές τοπικές επιλογές. Δεν δέχεται URL
provider από το UI ή το API και δεν κάνει fallback σε cloud υπηρεσία.

| Engine | Τοπικό API | Πότε να το χρησιμοποιήσεις / When to use it |
|---|---|---|
| **Ollama** (προεπιλογή) | `127.0.0.1:11434` | Για εύκολη εγκατάσταση, συχνή εναλλαγή μοντέλων και αυτόματη φόρτωση/αποφόρτωση. For simple local setup and model switching. |
| **LM Studio** | `127.0.0.1:1234/v1` | Για γραφικό περιβάλλον και χειροκίνητη λήψη, ρύθμιση και σύγκριση μοντέλων. For GUI-based local experimentation. Start its local server first. |
| **vLLM** | `127.0.0.1:8000/v1` | Για ταυτόχρονο GPU inference από πολλούς agents σε Linux, συμβατό WSL2 ή GPU server. For high-throughput concurrent inference. |

Η επιλογή engine ελέγχει το αντίστοιχο loopback API και εμφανίζει μόνο τα
μοντέλα που επιστρέφει εκείνο το API. Αν ο engine δεν εκτελείται, η εφαρμογή
δείχνει μήνυμα και δεν επηρεάζει τις άλλες επιλογές.

Το vLLM δεν υποστηρίζεται εγγενώς στα Windows. Η χρήση του μέσω RunPod ή
οποιουδήποτε άλλου remote provider είναι ξεχωριστή ρύθμιση remote
infrastructure και **δεν** υποστηρίζεται από αυτή την έκδοση: οι διευθύνσεις
παραμένουν αποκλειστικά `127.0.0.1`.

## Add Model — Ollama (new local UI feature)

When **Ollama** is the selected Inference Engine, expand **Add Model · Ollama**.
Enter an exact model name from the [Ollama model library](https://ollama.com/library),
for example `gemma3:4b`, then choose **Install model** and confirm the download.
Progress and errors appear in the Lab. After successful installation, the local
model selector refreshes and selects the downloaded model. Only one download can
run at a time; it may continue when the tab closes as long as the Lab stays running.

This is an explicit internet download by the local Ollama daemon to its own
model storage. **The Lab itself remains bound to loopback** and never receives
a remote provider URL, token, filesystem path, shell command, or cloud-inference
configuration. No packages or models are downloaded automatically. Check the
model's license, hardware requirements, network costs, and free disk space
before confirming: weights can consume many GB. Do not install cloud-hosted
models; the Lab filters them from local inference. If the model is unavailable
or the download fails, the error appears in the installer. Installation does
not train the model or install a compatible Transformers training directory.

LM Studio model downloads remain managed in the LM Studio application; vLLM
models are provisioned on the vLLM host. **Add Model** currently manages Ollama
only. The installer is intentionally separate from the PyTorch training wizard.

## Εκτέλεση στο laptop

1. Αποσυμπίεσε τον φάκελο π.χ. σε `C:\Markellos-Ecosystem-AI-Agents-Lab`.
2. Απενεργοποίησε τις cloud λειτουργίες του Ollama (οδηγίες αμέσως παρακάτω) και επανεκκίνησε το Ollama. Έπειτα εκτέλεσε `ollama list` ώστε να δεις το εγκατεστημένο μοντέλο (δεν απαιτείται login).
3. Κάνε διπλό κλικ στο `start-windows.bat` ή από PowerShell μέσα στον φάκελο: `py -3 server.py`.
4. Άνοιξε **http://127.0.0.1:8765/** στον browser.
5. Διάλεξε το τοπικό μοντέλο από τη λίστα και ξεκίνα συνεδρία.

Η υπηρεσία τερματίζεται με `Ctrl+C` στο παράθυρο PowerShell. Αν η θύρα 8765 χρησιμοποιείται ήδη, η εφαρμογή θα δείξει σφάλμα και δεν θα αντικαταστήσει καμία άλλη υπηρεσία.

### Desktop shortcut

The first run of `start-windows.bat` creates or refreshes a **Markellos AI
Agents University Lab** shortcut on the current user's Desktop. It uses the
included University Lab icon and opens the extracted copy of the Lab. This
shortcut creation is local only: it does not install Python, Ollama, PyTorch,
CUDA, models, drivers, or packages, and it makes no network request.

The Lab folder is the folder where the user extracted
`AI-Agents-Lab-Windows.zip`; no separate or hidden installation folder is
created. After manually updating to a new extracted folder, run that folder's
`start-windows.bat` once so the shortcut points to the new copy.

## Ενημερώσεις / Updates

Πάτησε **Check for updates / Έλεγχος ενημερώσεων** μέσα στο Local Lab μόνο όταν
θέλεις να ελέγξεις αν υπάρχει νεότερη έκδοση. Το κουμπί ζητά metadata από το
ένα επίσημο GitHub Releases endpoint του έργου, με χρονικό όριο και έλεγχο των
links. Δεν γίνεται αυτόματη λήψη, αποσυμπίεση, εγκατάσταση, εκκίνηση αρχείου ή
αλλαγή στις συνομιλίες, στα μοντέλα ή στις ρυθμίσεις σου.

Αν βρεθεί νεότερη έκδοση, άνοιξε τον προτεινόμενο επίσημο σύνδεσμο, κατέβασε το
ZIP χειροκίνητα και ακολούθησε τη διαδικασία αναβάθμισης: κλείσε πρώτα τον Lab,
κράτησε αντίγραφο του `data/campus.sqlite3`, αποσυμπίεσε σε νέο φάκελο,
μετέφερε τη βάση μόνο με κλειστό server αν θέλεις το ιστορικό σου, και ξεκίνα
τη νέα έκδοση. Κράτησε τον παλιό φάκελο έως ότου επιβεβαιώσεις ότι η νέα
εγκατάσταση λειτουργεί. Αν ο έλεγχος αποτύχει (π.χ. χωρίς Internet), δεν έχει
αλλάξει κανένα τοπικό αρχείο.

## Model Training / Εκπαίδευση Μοντέλων

The optional Training workspace performs real local parameter updates for a
compatible model using PEFT LoRA or TRL supervised fine-tuning. It is not an
agent exercise, inference request, or evaluation result. The standard Lab has
no ML dependencies: create `training/.venv`, install the pinned
`training/requirements.txt` there, and restart the Lab. No package, CUDA
toolkit, NVIDIA driver, model, or dataset is installed automatically.

Put an already downloaded compatible Transformers model directory below
`models/` and a selected JSONL file below `training-data/`. Each non-empty line
must be an object with a `text` string, for example `{"text":"User: Hello\nAssistant: Hello"}`.
Adapters, checkpoints, and status records are written only under
`training-output/`; these directories are excluded from Git. The server never
accepts paths, commands, model URLs, or remote datasets from the browser.

Compute choices are Auto (CUDA when PyTorch supports it, otherwise CPU), CPU,
and CUDA GPU. Explicit CUDA selection fails rather than falling back to CPU.
For a CUDA-capable build, install the PyTorch build appropriate to your Windows
driver and supported CUDA runtime using the official PyTorch selector, then
install the remaining pinned requirements in the same virtual environment.
CUDA is optional and no GPU, CUDA Toolkit, or driver is needed for the basic
Lab. A GPU out-of-memory failure leaves the job failed with retained partial
output; reduce model size or sequence length before retrying.

### Installation guide / Οδηγός εγκατάστασης

The following is an **optional local installation** for training only. Do not
run it for the normal Ollama, LM Studio, or vLLM inference workflow.

**Guided path / Απλός χρήστης:** double-click
`setup-training-windows.bat`. The Windows Training Setup Wizard checks Python
3.11/3.12 and disk space, asks for CPU or NVIDIA CUDA, displays the exact CPU
libraries before download, asks for confirmation, creates `training\.venv`, and
runs a health check. It never downloads models/datasets, modifies inference,
installs drivers, or falls back from selected CUDA to CPU. CUDA setup opens the
official PyTorch selector because the matching wheel depends on the local
NVIDIA driver; the wizard verifies CUDA only after that explicit installation.

**Expert path / Προχωρημένος χρήστης:** use the commands below directly to
choose a specific supported Python, a corporate package mirror, or a PyTorch
CUDA build. Both paths use the same `training\.venv` and output folders.

1. Install a Python version supported by the pinned ML packages (use Python
   3.11 or 3.12 for this release). Python 3.14 is not compatible with the
   packaged `torch==2.7.1` requirement. Confirm the launcher can see it:

   ```powershell
   py -3.12 --version
   ```

2. Open PowerShell in the extracted `apps\local-ai-agents-lab` directory and
   create the isolated environment. This does not change the system Python:

   ```powershell
   py -3.12 -m venv training\.venv
   training\.venv\Scripts\python.exe -m pip install --upgrade pip
   ```

3. For **CPU training**, install the documented pinned packages:

   ```powershell
   training\.venv\Scripts\python.exe -m pip install -r training\requirements.txt
   ```

4. For **NVIDIA CUDA training**, first use the official [PyTorch installation
   selector](https://pytorch.org/get-started/locally/) to choose a Windows,
   Pip, Python, and CUDA build matching the installed NVIDIA driver. Install
   that `torch` command in `training\.venv`, then install the remaining
   packages from `requirements.txt`. Do not install drivers, a CUDA Toolkit,
   or a CUDA-enabled PyTorch build automatically from the Lab.

5. Verify the environment and hardware detection before starting the Lab:

   ```powershell
   training\.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')"
   ```

6. Create these local directories beside `server.py` if they do not exist:

   ```text
   models\<your-compatible-local-transformers-model>\
   training-data\<dataset>.jsonl
   ```

   Model files must already be downloaded. The Lab intentionally uses
   `local_files_only=True`; it will not download models. Every JSONL line must
   be a small valid JSON object with one non-empty `text` field:

   ```json
   {"text":"User: Explain LoRA briefly.\nAssistant: LoRA fine-tunes small adapter matrices."}
   ```

7. Start the Lab, open `http://127.0.0.1:8765/`, then open **Model Training /
   Εκπαίδευση Μοντέλων**. Select the model, JSONL dataset, LoRA or SFT, and
   Auto, CPU, or CUDA GPU. Review the shown configuration and confirm the
   explicit start prompt. Only one job can run at a time.

8. Read the status and output location in the Training workspace. Finished
   adapters and checkpoints remain under `training-output\<job-id>\`; keep
   these files local and back them up separately if needed. A stopped or failed
   job preserves partial output. An explicit CUDA selection never falls back to
   CPU—correct the PyTorch/CUDA installation or choose CPU intentionally.

### Τι εγκαθίσταται και τι δεν εγκαθίσταται

- Εγκαθίστανται τοπικά, μόνο στο `training\.venv`: PyTorch, Transformers,
  PEFT, TRL και οι εξαρτήσεις τους.
- Δεν περιλαμβάνονται ούτε εγκαθίστανται αυτόματα: CUDA drivers/Toolkit,
  μοντέλα, datasets, adapters, checkpoints ή cloud credentials.
- Το ZIP περιέχει μόνο τον κώδικα και τις οδηγίες για τη λειτουργία Training.
  Η κύρια εφαρμογή και τα Ollama / LM Studio / vLLM συνεχίζουν να λειτουργούν
  χωρίς αυτές τις βιβλιοθήκες.

## Υποχρεωτική ρύθμιση για πλήρη τοπική λειτουργία Ollama

Δημιούργησε ή επεξεργάσου το αρχείο `%USERPROFILE%\.ollama\server.json` με περιεχόμενο:

```json
{
  "disable_ollama_cloud": true
}
```

**Πριν το αντικαταστήσεις**, αν υπάρχει ήδη αρχείο, κράτησε τις άλλες υπάρχουσες ρυθμίσεις και πρόσθεσε μόνο το πεδίο `disable_ollama_cloud`. Επανεκκίνησε **το Ollama**, όχι μόνο την εφαρμογή μας. Σύμφωνα με την τεκμηρίωση του Ollama, αυτό απενεργοποιεί τόσο τα cloud models όσο και το web search. Εναλλακτικά, υπάρχει η μεταβλητή περιβάλλοντος `OLLAMA_NO_CLOUD=1` που πρέπει να οριστεί **στο process του Ollama**.

## Ιδιωτικότητα και όρια

- Ο web server δεσμεύεται **μόνο** στο `127.0.0.1:8765`.
- Η εφαρμογή συνδέεται **μόνο** με `127.0.0.1:11434` (Ollama). Δεν έχει cloud API keys, tracking, CDN, εξωτερική βιβλιοθήκη ή online λειτουργία.
- Οι επιλογές με `cloud` στο όνομα φιλτράρονται, αλλά αυτό **δεν είναι αρκετή εγγύηση**. Για πραγματικά τοπική εκτέλεση, ενεργοποίησε το `disable_ollama_cloud` του Ollama όπως περιγράφεται παραπάνω και χρησιμοποίησε μόνο downloaded local models.
- Το αρχείο `data/campus.sqlite3` δημιουργείται αυτόματα και αποθηκεύει τις συζητήσεις χωρίς κρυπτογράφηση. Χρησιμοποίησε BitLocker/Windows device encryption εάν απαιτείται προστασία at rest.
- Οποιοσδήποτε έχει πρόσβαση στον **ίδιο Windows λογαριασμό/συσκευή** μπορεί ενδεχομένως να διαβάσει το αρχείο.
- Κατά τη **λήψη/εγκατάσταση** Python, Ollama και μοντέλου απαιτείται σύνδεση στο Internet. Μετέπειτα η βασική εφαρμογή δεν χρειάζεται Internet.
- Το chat ChatGPT στο οποίο συζητάς τώρα **δεν είναι** τοπική υπηρεσία. Μην επικολλάς εδώ ιδιωτικά δεδομένα της εφαρμογής αν δεν θέλεις να σταλούν σε τρίτη υπηρεσία.
- Μη δημοσιεύσεις το `data/` σε GitHub. Το αρχείο `.gitignore` αποκλείει τη βάση.

## Αντίγραφο ασφαλείας

Κλείσε πρώτα τον server και αντέγραψε το `data/campus.sqlite3` σε ασφαλή τοποθεσία. Η SQLite διατηρεί τις δύο αίθουσες με ξεχωριστό ιστορικό.

## Τεχνικά

- Python standard library μόνο: HTTP server + SQLite + local Ollama HTTP API.
- Δεν εγκαθιστά πακέτα Python, services, scheduled tasks, Git hooks ή αρχεία εκτός του φακέλου της εφαρμογής.
- Πειραματικό MVP, όχι πιστοποιημένο σύστημα ασφάλειας ή αξιολόγησης agents.

## Μετονομασία από το αρχικό ZIP

Το πακέτο **AI-Agents-University-Local-Starter.zip** αντικαθίσταται από αυτό το ZIP. Αν έχεις ήδη τρέξει την παλιά έκδοση, κλείσε πρώτα τον server. Η βάση `data/campus.sqlite3` **δεν** περιλαμβάνεται στο ZIP και δεν μεταφέρεται αυτόματα. Για να διατηρήσεις προηγούμενες συνομιλίες, πάρε αντίγραφο της υπάρχουσας βάσης και τοποθέτησέ το στον αντίστοιχο φάκελο `data/` της νέας εφαρμογής, μόνο με κλειστό server. Μην διαγράψεις τον παλιό φάκελο πριν ελέγξεις τη νέα εγκατάσταση.

Για το laptop με ήδη εγκατεστημένο Ollama και τοπικά Qwen μοντέλα, δεν χρειάζεται νέο `ollama pull` εφόσον το επιθυμητό μοντέλο εμφανίζεται στο `ollama list`.

## Αυτόματο Build ID και ελεγχόμενο deployment

Η έκδοση ορίζεται στο αρχείο VERSION (π.χ. 0.1.1).
Το Build ID παράγεται αυτόματα από την έκδοση, τον χρόνο commit στη
ζώνη Europe/Nicosia και τα πρώτα επτά ψηφία του πραγματικού commit SHA.

Από το checkout του repository, μέσα στο apps/local-ai-agents-lab:

    node scripts/build-release.cjs HEAD C:\Temp\lab-release-new
    node scripts/verify-release.cjs C:\Temp\lab-release-new\local-ai-agents-lab FULL_SHA

Ο verifier ελέγχει το release.json και τις δύο ενδείξεις Build ID
στο Info και Footer. Μετά από merge στο main, τα GitHub Actions
δημιουργούν επαληθευμένο artifact εγκατάστασης για το commit.

Για εγκατάσταση στο laptop: backup, τερματισμός της τοπικής
εφαρμογής, αντιγραφή μόνο των αρχείων του πακέτου, επανεκκίνηση
και verification. Διατηρούμε το data/ και τα τοπικά μοντέλα Ollama.
Το Build ID δεν πληκτρολογείται ποτέ χειροκίνητα κατά το deployment.
Η εγκατάσταση στο laptop απαιτεί ξεχωριστή έγκριση και δεν γίνεται
αυτόματα από τα GitHub Actions.
