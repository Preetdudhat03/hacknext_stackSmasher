import os
# --- STABILITY OVERRIDES ---
# Force single threading to avoid MKL/OpenBLAS deadlocks on Windows
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
# Disable Numba JIT to avoid long compilation hangs on first run
os.environ['NUMBA_DISABLE_JIT'] = '1'
# ---------------------------

from pydantic import BaseModel

class Settings(BaseModel):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DEBUG: bool = True

settings = Settings()
