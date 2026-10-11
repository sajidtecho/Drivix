import os
import sys
import io
import base64
import traceback
from contextlib import redirect_stdout, redirect_stderr
import nbformat as nbf
import matplotlib.pyplot as plt

def execute_notebook(nb_path, working_dir=None):
    """
    Executes a Jupyter notebook in-process, capturing all stdout, stderr,
    data outputs, and matplotlib figures directly into the notebook cells.
    Avoids Windows zmq/tornado socket issues.
    """
    print(f"\n=======================================================")
    print(f"Executing: {nb_path}")
    print(f"=======================================================")

    nb_abs_path = os.path.abspath(nb_path)
    with open(nb_abs_path, 'r', encoding='utf-8') as f:
        nb = nbf.read(f, as_version=4)

    orig_cwd = os.getcwd()
    if working_dir:
        os.chdir(working_dir)

    global_ns = {
        '__name__': '__main__',
        '__file__': os.path.abspath(nb_path),
    }

    execution_count = 1

    try:
        for idx, cell in enumerate(nb.cells):
            if cell.cell_type == 'code':
                code = cell.source
                cell.outputs = []
                cell.execution_count = execution_count
                execution_count += 1

                stdout_buf = io.StringIO()
                stderr_buf = io.StringIO()

                plt.close('all') # Clear previous plots

                try:
                    with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
                        # Compile and execute
                        exec(code, global_ns)
                    
                    stdout_str = stdout_buf.getvalue()
                    stderr_str = stderr_buf.getvalue()

                    if stdout_str:
                        cell.outputs.append(nbf.v4.new_output(
                            output_type='stream',
                            name='stdout',
                            text=stdout_str
                        ))
                    if stderr_str:
                        cell.outputs.append(nbf.v4.new_output(
                            output_type='stream',
                            name='stderr',
                            text=stderr_str
                        ))

                    # Check if a matplotlib figure was generated and not yet closed
                    figs = [plt.figure(num) for num in plt.get_fignums()]
                    for fig in figs:
                        img_buf = io.BytesIO()
                        fig.savefig(img_buf, format='png', bbox_inches='tight', dpi=150)
                        img_buf.seek(0)
                        img_base64 = base64.b64encode(img_buf.read()).decode('utf-8')
                        cell.outputs.append(nbf.v4.new_output(
                            output_type='display_data',
                            data={'image/png': img_base64},
                            metadata={}
                        ))
                        plt.close(fig)

                except Exception as e:
                    err_msg = traceback.format_exc()
                    print(f"Error in cell {idx + 1}:\n{err_msg}")
                    cell.outputs.append(nbf.v4.new_output(
                        output_type='error',
                        ename=type(e).__name__,
                        evalue=str(e),
                        traceback=err_msg.splitlines()
                    ))
                    raise e

        # Save executed notebook
        with open(nb_abs_path, 'w', encoding='utf-8') as f:
            nbf.write(nb, f)
        print(f"Successfully executed and saved: {nb_path}")

    finally:
        os.chdir(orig_cwd)
        plt.close('all')

if __name__ == "__main__":
    import build_nb1
    import build_nb2
    import build_nb3_to_nb6

    # 1. Regenerate all notebooks clean
    print("Regenerating notebook templates...")
    build_nb1.build_notebook_1()
    build_nb2.build_notebook_2()
    build_nb3_to_nb6.build_notebook_3()
    build_nb3_to_nb6.build_notebook_4()
    build_nb3_to_nb6.build_notebook_5()
    build_nb3_to_nb6.build_notebook_6()

    # 2. Execute each notebook in order with working directory set to notebooks/
    notebooks = [
        "notebooks/01_data_understanding_and_validation.ipynb",
        "notebooks/02_exploratory_data_analysis.ipynb",
        "notebooks/03_data_preprocessing_and_feature_engineering.ipynb",
        "notebooks/04_feature_selection.ipynb",
        "notebooks/05_model_training_and_comparison.ipynb",
        "notebooks/06_hyperparameter_tuning_and_evaluation.ipynb"
    ]

    for nb_path in notebooks:
        execute_notebook(nb_path, working_dir="notebooks")

    print("\nALL 6 NOTEBOOKS EXECUTED CLEANLY WITH OUTPUTS AND VISUALIZATIONS EMBEDDED!")
