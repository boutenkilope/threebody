# threebody

A simple simulation of the three-body problem in python.

Re-reading Liu Cixin's Three-Body Problem, wanted to make this to visualize the three-body problem.

Initially done in Python, then I asked cursor to port it to JavaScript.

## How to run

### JS

Test it [here](https://boutenkilope.github.io/threebody/), or simply open the `index.html` file in your browser on local.

### Python

Install [pygame](https://pypi.org/project/pygame/), then run `threebody.py` with python 3.11 or higher.

You can change the number of stars as a command line argument, for example:

```bash
./threebody.py 17
```

To run with 17 stars.

-   pressing `r` will reset the simulation.
-   pressing `p` will pause/unpause the simulation.
-   pressing `q` will quit the simulation.
-   pressing `z/a` will zoom in/out.
-   pressing `←/→/↑/↓` will move the view.
